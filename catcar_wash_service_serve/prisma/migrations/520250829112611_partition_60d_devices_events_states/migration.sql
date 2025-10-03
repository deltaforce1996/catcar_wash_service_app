-- =========================================================
-- Convert non-partitioned public.tbl_devices_events to partitioned (60-day)
-- Remove column "type"
-- =========================================================

DO $$
DECLARE
  _exists_partitioned boolean;
BEGIN
  -- ถ้าเป็น partitioned อยู่แล้ว (relkind = 'p') ให้ข้ามส่วน convert
  SELECT (c.relkind = 'p')
  INTO _exists_partitioned
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'tbl_devices_events';

  IF coalesce(_exists_partitioned, false) THEN
    RAISE NOTICE 'tbl_devices_events is already partitioned. Skipping convert.';
    RETURN;
  END IF;
END$$;

-- ---------------------------------------------------------
-- เตรียมตารางใหม่แบบ partitioned (ชื่อชั่วคราว: tbl_devices_events_p)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."tbl_devices_events_p" (
  "id"         TEXT NOT NULL,
  "device_id"  TEXT NOT NULL,
  "payload"    JSONB,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tbl_devices_events_p_device_id_fkey"
    FOREIGN KEY ("device_id") REFERENCES "public"."tbl_devices"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
) PARTITION BY RANGE ("created_at");

-- ---------------------------------------------------------
-- ฟังก์ชันสร้างพาร์ทิชันช่วงละ 60 วัน + ดัชนีต่อพาร์ทิชัน
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."create_tbl_devices_events_partitions"(
  start_bound DATE,
  end_bound   DATE
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  parent_table TEXT := 'tbl_devices_events_p';
  cur_start DATE;
  cur_end   DATE;
  part_name TEXT;
BEGIN
  IF end_bound <= start_bound THEN
    RAISE EXCEPTION 'end_bound (%) must be greater than start_bound (%)', end_bound, start_bound;
  END IF;

  cur_start := start_bound;
  WHILE cur_start < end_bound LOOP
    cur_end   := cur_start + interval '60 days';
    part_name := format('%s_%s_to_%s',
      'tbl_devices_events', to_char(cur_start,'YYYYMMDD'), to_char(cur_end,'YYYYMMDD'));

    -- สร้าง partition
    EXECUTE format($SQL$
      CREATE TABLE IF NOT EXISTS "public"."%I"
      PARTITION OF "public"."%I"
      FOR VALUES FROM (%L) TO (%L);
    $SQL$, part_name, parent_table, cur_start::date, cur_end::date);

    -- ดัชนีต่อพาร์ทิชัน
    EXECUTE format($SQL$
      CREATE INDEX IF NOT EXISTS "%I_created_at_idx"
        ON "public"."%I" ("created_at");
    $SQL$, part_name, part_name);

    EXECUTE format($SQL$
      CREATE INDEX IF NOT EXISTS "%I_dev_created_idx"
        ON "public"."%I" ("device_id","created_at");
    $SQL$, part_name, part_name);

    cur_start := cur_end::date;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------
-- คำนวณช่วงวันที่มีข้อมูลในตารางเดิม เพื่อสร้างพาร์ทิชันให้ครอบคลุม
-- ถ้าไม่มีข้อมูล จะ seed ช่วงมาตรฐาน 1 ปีข้างหน้า
-- ---------------------------------------------------------
DO $$
DECLARE
  v_min TIMESTAMPTZ;
  v_max TIMESTAMPTZ;
  v_from DATE;
  v_to   DATE;
BEGIN
  SELECT min(created_at), max(created_at)
  INTO v_min, v_max
  FROM "public"."tbl_devices_events";

  IF v_min IS NULL OR v_max IS NULL THEN
    -- ไม่มีข้อมูล: seed ช่วงปกติ (ปรับได้ตามต้องการ)
    v_from := date_trunc('day', now() AT TIME ZONE 'UTC')::date;
    v_to   := (v_from + interval '365 days')::date;
  ELSE
    v_from := date_trunc('day', v_min AT TIME ZONE 'UTC')::date;
    -- บวก buffer เพื่อครอบคลุมพาร์ทิชันสุดท้าย
    v_to   := (date_trunc('day', v_max AT TIME ZONE 'UTC') + interval '60 days')::date;
  END IF;

  PERFORM "public"."create_tbl_devices_events_partitions"(v_from, v_to);
END$$;

-- ---------------------------------------------------------
-- คัดลอกข้อมูลจากตารางเดิม → ตารางใหม่ (ตัดคอลัมน์ type ออก)
-- หมายเหตุ: ถ้าตารางเดิมไม่มีคอลัมน์ type จะไม่ error เพราะเราเจาะคอลัมน์เป้าหมาย
-- ---------------------------------------------------------
INSERT INTO "public"."tbl_devices_events_p" ("id","device_id","payload","created_at")
SELECT "id","device_id","payload","created_at"
FROM "public"."tbl_devices_events";

-- ---------------------------------------------------------
-- สลับชื่อ (downtime ช่วงสั้น ๆ)
-- ---------------------------------------------------------
BEGIN;
  -- ล็อกตารางเดิมแบบสั้น ๆ เพื่อความสม่ำเสมอ
  LOCK TABLE "public"."tbl_devices_events" IN ACCESS EXCLUSIVE MODE;

  -- เปลี่ยนชื่อของเดิมเก็บไว้เผื่อ rollback manual
  ALTER TABLE "public"."tbl_devices_events" RENAME TO "tbl_devices_events_old";

  -- เปลี่ยนชื่อตารางใหม่ให้เป็นชื่อเดิม
  ALTER TABLE "public"."tbl_devices_events_p" RENAME TO "tbl_devices_events";

  -- ย้ายชื่อ constraint FK ให้กลับมาเป็นรูปเดิม (ไม่บังคับ ถ้าไม่มี dependency ชื่อ)
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'tbl_devices_events_p_device_id_fkey'
    ) THEN
      ALTER TABLE "public"."tbl_devices_events"
        RENAME CONSTRAINT "tbl_devices_events_p_device_id_fkey"
        TO "tbl_devices_events_device_id_fkey";
    END IF;
  END$$;
COMMIT;



-- ---------------------------------------------------------
-- (ทางเลือก) เก็บตารางเดิมไว้ชั่วคราว หรือจะลบทิ้งก็ได้หลังตรวจสอบครบ
DROP TABLE IF EXISTS "public"."tbl_devices_events_old";
-- ---------------------------------------------------------



-- AlterTable
ALTER TABLE "public"."tbl_devices_events" ADD CONSTRAINT "tbl_devices_events_pkey" PRIMARY KEY ("id", "created_at");

-- CreateIndex
CREATE INDEX "tbl_devices_events_device_id_created_at_idx" ON "public"."tbl_devices_events"("device_id", "created_at");
