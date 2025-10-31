-- =========================================================
-- Convert non-partitioned public.tbl_devices_events to partitioned (60-day)
-- Remove column "type"
-- =========================================================

DO $$
DECLARE
  _is_partitioned boolean;
  _old_table_exists boolean;
  _temp_table_exists boolean;
BEGIN
  -- Check if migration is already completed
  -- Conditions: tbl_devices_events is partitioned, _old exists, _p doesn't exist

  -- Check if tbl_devices_events is partitioned
  SELECT (c.relkind = 'p')
  INTO _is_partitioned
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'tbl_devices_events';

  -- Check if tbl_devices_events_old exists
  SELECT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'tbl_devices_events_old'
  ) INTO _old_table_exists;

  -- Check if tbl_devices_events_p exists (temp table)
  SELECT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'tbl_devices_events_p'
  ) INTO _temp_table_exists;

  -- If main table is partitioned AND old table exists AND temp table doesn't exist
  -- Then migration is complete, skip everything
  IF coalesce(_is_partitioned, false)
     AND coalesce(_old_table_exists, false)
     AND NOT coalesce(_temp_table_exists, false) THEN
    RAISE NOTICE '=== MIGRATION ALREADY COMPLETED ===';
    RAISE NOTICE 'tbl_devices_events is partitioned: %', _is_partitioned;
    RAISE NOTICE 'tbl_devices_events_old exists: %', _old_table_exists;
    RAISE NOTICE 'tbl_devices_events_p exists: %', _temp_table_exists;
    RAISE NOTICE 'Skipping migration - already applied successfully.';
    RETURN;
  END IF;

  RAISE NOTICE '=== STARTING MIGRATION ===';
  RAISE NOTICE 'tbl_devices_events is partitioned: %', coalesce(_is_partitioned, false);
  RAISE NOTICE 'tbl_devices_events_old exists: %', coalesce(_old_table_exists, false);
  RAISE NOTICE 'tbl_devices_events_p exists: %', coalesce(_temp_table_exists, false);
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
  _source_table TEXT;
  _old_exists boolean;
BEGIN
  -- Determine which table to read data range from
  -- Prefer tbl_devices_events if it's not partitioned yet
  -- Otherwise use tbl_devices_events_old if it exists

  SELECT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'tbl_devices_events_old'
  ) INTO _old_exists;

  -- If old table exists, table swap happened, read from it
  -- Otherwise read from main table (not swapped yet)
  IF _old_exists THEN
    _source_table := 'tbl_devices_events_old';
    RAISE NOTICE 'Reading date range from tbl_devices_events_old';
  ELSE
    _source_table := 'tbl_devices_events';
    RAISE NOTICE 'Reading date range from tbl_devices_events';
  END IF;

  -- Read min/max dates from the source table
  EXECUTE format('SELECT min(created_at), max(created_at) FROM "public"."%I"', _source_table)
  INTO v_min, v_max;

  IF v_min IS NULL OR v_max IS NULL THEN
    -- ไม่มีข้อมูล: seed ช่วงปกติ (ปรับได้ตามต้องการ)
    v_from := date_trunc('day', now() AT TIME ZONE 'UTC')::date;
    v_to   := (v_from + interval '365 days')::date;
    RAISE NOTICE 'No data found. Creating partitions for 1 year from today.';
  ELSE
    v_from := date_trunc('day', v_min AT TIME ZONE 'UTC')::date;
    -- บวก buffer เพื่อครอบคลุมพาร์ทิชันสุดท้าย
    v_to   := (date_trunc('day', v_max AT TIME ZONE 'UTC') + interval '60 days')::date;
    RAISE NOTICE 'Creating partitions from % to % based on existing data', v_from, v_to;
  END IF;

  PERFORM "public"."create_tbl_devices_events_partitions"(v_from, v_to);
END$$;

-- ---------------------------------------------------------
-- คัดลอกข้อมูลจากตารางเดิม → ตารางใหม่ (ตัดคอลัมน์ type ออก)
-- หมายเหตุ: ถ้าตารางเดิมไม่มีคอลัมน์ type จะไม่ error เพราะเราเจาะคอลัมน์เป้าหมาย
-- ---------------------------------------------------------
DO $$
DECLARE
  _p_table_count INTEGER;
BEGIN
  -- Check if tbl_devices_events_p already has data
  SELECT COUNT(*) INTO _p_table_count
  FROM "public"."tbl_devices_events_p";

  IF _p_table_count > 0 THEN
    RAISE NOTICE 'tbl_devices_events_p already contains % rows. Skipping data copy.', _p_table_count;
  ELSE
    RAISE NOTICE 'Copying data from tbl_devices_events to tbl_devices_events_p...';
    INSERT INTO "public"."tbl_devices_events_p" ("id","device_id","payload","created_at")
    SELECT "id","device_id","payload","created_at"
    FROM "public"."tbl_devices_events";
    RAISE NOTICE 'Data copy completed.';
  END IF;
END$$;

-- ---------------------------------------------------------
-- Validate row count (safety check)
-- ---------------------------------------------------------
DO $$
DECLARE
  old_count INTEGER;
  new_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_count FROM "public"."tbl_devices_events";
  SELECT COUNT(*) INTO new_count FROM "public"."tbl_devices_events_p";

  RAISE NOTICE '=== DATA VALIDATION ===';
  RAISE NOTICE 'Old table row count: %', old_count;
  RAISE NOTICE 'New table row count: %', new_count;

  IF old_count != new_count THEN
    RAISE EXCEPTION 'Row count mismatch! Old: %, New: %. Migration aborted.', old_count, new_count;
  ELSE
    RAISE NOTICE 'Row count validation PASSED ✓';
  END IF;
END$$;

-- ---------------------------------------------------------
-- สลับชื่อ (downtime ช่วงสั้น ๆ)
-- ---------------------------------------------------------
DO $$
DECLARE
  _swap_needed boolean := false;
  _p_exists boolean;
  _old_exists boolean;
  _main_is_partitioned boolean;
BEGIN
  -- Check if table swap is needed
  -- Swap is needed if: _p exists, _old doesn't exist, main is not partitioned

  -- Check if tbl_devices_events_p exists
  SELECT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'tbl_devices_events_p'
  ) INTO _p_exists;

  -- Check if tbl_devices_events_old exists
  SELECT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'tbl_devices_events_old'
  ) INTO _old_exists;

  -- Check if main table is partitioned
  SELECT (c.relkind = 'p')
  INTO _main_is_partitioned
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'tbl_devices_events';

  -- Determine if swap is needed
  _swap_needed := coalesce(_p_exists, false)
                  AND NOT coalesce(_old_exists, false)
                  AND NOT coalesce(_main_is_partitioned, false);

  IF NOT _swap_needed THEN
    RAISE NOTICE '=== TABLE SWAP ALREADY COMPLETED ===';
    RAISE NOTICE 'tbl_devices_events_p exists: %', coalesce(_p_exists, false);
    RAISE NOTICE 'tbl_devices_events_old exists: %', coalesce(_old_exists, false);
    RAISE NOTICE 'tbl_devices_events is partitioned: %', coalesce(_main_is_partitioned, false);
    RAISE NOTICE 'Skipping table swap - already done.';
    RETURN;
  END IF;

  RAISE NOTICE '=== PERFORMING TABLE SWAP ===';

  -- Perform the swap in a transaction-like manner
  -- Note: We can't use BEGIN/COMMIT inside DO block, so we rely on idempotency checks

  -- Lock the main table
  EXECUTE 'LOCK TABLE "public"."tbl_devices_events" IN ACCESS EXCLUSIVE MODE';

  -- Rename old table
  EXECUTE 'ALTER TABLE "public"."tbl_devices_events" RENAME TO "tbl_devices_events_old"';
  RAISE NOTICE 'Renamed tbl_devices_events -> tbl_devices_events_old';

  -- Rename new partitioned table
  EXECUTE 'ALTER TABLE "public"."tbl_devices_events_p" RENAME TO "tbl_devices_events"';
  RAISE NOTICE 'Renamed tbl_devices_events_p -> tbl_devices_events';

  -- Rename FK constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tbl_devices_events_p_device_id_fkey'
  ) THEN
    EXECUTE 'ALTER TABLE "public"."tbl_devices_events" RENAME CONSTRAINT "tbl_devices_events_p_device_id_fkey" TO "tbl_devices_events_device_id_fkey"';
    RAISE NOTICE 'Renamed FK constraint';
  END IF;

  RAISE NOTICE '=== TABLE SWAP COMPLETED ===';
END$$;



-- ---------------------------------------------------------
-- (SAFETY) เก็บตารางเดิมไว้เป็น backup สำหรับตรวจสอบและ rollback
-- แนะนำให้เก็บไว้อย่างน้อย 30-90 วัน หลังจากตรวจสอบข้อมูลครบถ้วนแล้ว
-- สามารถลบด้วยมือได้ทีหลังด้วยคำสั่ง:
--   DROP TABLE IF EXISTS "public"."tbl_devices_events_old";
-- ---------------------------------------------------------
-- DROP TABLE IF EXISTS "public"."tbl_devices_events_old";



-- AlterTable - Add PRIMARY KEY with idempotency check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.tbl_devices_events'::regclass
      AND conname = 'tbl_devices_events_pkey'
  ) THEN
    ALTER TABLE "public"."tbl_devices_events"
      ADD CONSTRAINT "tbl_devices_events_pkey"
      PRIMARY KEY ("id", "created_at");
    RAISE NOTICE 'PRIMARY KEY created';
  ELSE
    RAISE NOTICE 'PRIMARY KEY already exists, skipping';
  END IF;
END$$;

-- CreateIndex - Use IF NOT EXISTS for idempotency
CREATE INDEX IF NOT EXISTS "tbl_devices_events_device_id_created_at_idx"
  ON "public"."tbl_devices_events"("device_id", "created_at");
