-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."EmpStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."PermissionType" AS ENUM ('ADMIN', 'TECHNICIAN', 'USER');

-- CreateEnum
CREATE TYPE "public"."DeviceType" AS ENUM ('WASH', 'DRYING');

-- CreateEnum
CREATE TYPE "public"."DeviceStatus" AS ENUM ('DEPLOYED', 'DISABLED');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('PAYMENT', 'INFO');

-- CreateEnum
CREATE TYPE "public"."TokenState" AS ENUM ('ACTIVATED', 'DISABLED');

-- CreateTable
CREATE TABLE "public"."tbl_permissions" (
    "id" TEXT NOT NULL,
    "name" "public"."PermissionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_users" (
    "id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "phone" TEXT,
    "address" TEXT,
    "password" TEXT NOT NULL,
    "custom_name" TEXT,
    "permission_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_emps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "line" TEXT,
    "password" TEXT NOT NULL,
    "address" TEXT,
    "permission_id" TEXT,
    "status" "public"."EmpStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_emps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_devices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."DeviceType" NOT NULL,
    "status" "public"."DeviceStatus" NOT NULL DEFAULT 'DISABLED',
    "information" JSONB,
    "configs" JSONB,
    "owner_id" TEXT NOT NULL,
    "register_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_devices_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "public"."tbl_reset_password_token" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "state" "public"."TokenState" NOT NULL DEFAULT 'ACTIVATED',
    "expire_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_user_id" TEXT,
    "owner_emp_id" TEXT,

    CONSTRAINT "tbl_reset_password_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_permissions_name_key" ON "public"."tbl_permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_users_email_key" ON "public"."tbl_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_emps_email_key" ON "public"."tbl_emps"("email");

-- CreateIndex
CREATE INDEX "tbl_devices_owner_id_idx" ON "public"."tbl_devices"("owner_id");

-- CreateIndex
CREATE INDEX "tbl_devices_register_by_idx" ON "public"."tbl_devices"("register_by_id");

-- CreateIndex
CREATE INDEX "tbl_devices_status_idx" ON "public"."tbl_devices"("status");

-- CreateIndex
CREATE INDEX "tbl_devices_type_idx" ON "public"."tbl_devices"("type");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_reset_password_token_token_key" ON "public"."tbl_reset_password_token"("token");

-- CreateIndex
CREATE INDEX "tbl_reset_password_token_email_state_idx" ON "public"."tbl_reset_password_token"("email", "state");

-- CreateIndex
CREATE INDEX "tbl_reset_password_token_token_state_idx" ON "public"."tbl_reset_password_token"("token", "state");

-- CreateIndex
CREATE INDEX "tbl_reset_password_token_owner_user_id_idx" ON "public"."tbl_reset_password_token"("owner_user_id");

-- CreateIndex
CREATE INDEX "tbl_reset_password_token_owner_emp_id_idx" ON "public"."tbl_reset_password_token"("owner_emp_id");

-- AddForeignKey
ALTER TABLE "public"."tbl_users" ADD CONSTRAINT "tbl_users_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."tbl_permissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tbl_emps" ADD CONSTRAINT "tbl_emps_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."tbl_permissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tbl_devices" ADD CONSTRAINT "tbl_devices_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."tbl_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tbl_devices" ADD CONSTRAINT "tbl_devices_register_by_id_fkey" FOREIGN KEY ("register_by_id") REFERENCES "public"."tbl_emps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tbl_reset_password_token" ADD CONSTRAINT "tbl_reset_password_token_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "public"."tbl_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tbl_reset_password_token" ADD CONSTRAINT "tbl_reset_password_token_owner_emp_id_fkey" FOREIGN KEY ("owner_emp_id") REFERENCES "public"."tbl_emps"("id") ON DELETE CASCADE ON UPDATE CASCADE;




-- =========================================
-- Partitioned parent: tbl_devices_state
-- =========================================
CREATE TABLE "public"."tbl_devices_state" (
  "id"         TEXT NOT NULL,
  "device_id"  TEXT NOT NULL,
  "state_data" JSONB,
  "hash_state" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tbl_devices_state_device_id_fkey"
    FOREIGN KEY ("device_id") REFERENCES "public"."tbl_devices"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
) PARTITION BY RANGE ("created_at");

-- =========================================
-- Partitioned parent: tbl_devices_events
-- =========================================
CREATE TABLE "public"."tbl_devices_events" (
  "id"         TEXT NOT NULL,
  "device_id"  TEXT NOT NULL,
  "payload"    JSONB,
  "type"       "public"."EventType" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tbl_devices_events_device_id_fkey"
    FOREIGN KEY ("device_id") REFERENCES "public"."tbl_devices"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
) PARTITION BY RANGE ("created_at");

-- =========================================
-- Create 60-day partitions (rolling window)
-- =========================================
DO $$
DECLARE
  parent_table text;
  start_bound  date := (date_trunc('day', now()) - interval '120 days')::date;
  end_bound    date := (date_trunc('day', now()) + interval '180 days')::date;
  cur_start    date;
  cur_end      date;
  part_name    text;
BEGIN
  -- ---------- tbl_devices_state ----------
  parent_table := 'tbl_devices_state';
  cur_start := start_bound;
  WHILE cur_start < end_bound LOOP
    cur_end   := cur_start + interval '60 days';
    part_name := format('%s_%s_to_%s',
      parent_table, to_char(cur_start,'YYYYMMDD'), to_char(cur_end,'YYYYMMDD'));

    EXECUTE format($SQL$
      CREATE TABLE IF NOT EXISTS "public"."%I"
      PARTITION OF "public"."%I"
      FOR VALUES FROM (%L) TO (%L);
      -- per-partition indexes
      CREATE INDEX IF NOT EXISTS %I_created_at_idx ON "public"."%I"("created_at");
      CREATE INDEX IF NOT EXISTS %I_dev_created_idx ON "public"."%I"("device_id","created_at");
    $SQL$, part_name, parent_table, cur_start::date, cur_end::date,
          part_name, part_name, part_name, part_name);

    -- best-effort PK per partition (PK บน parent จะใช้ไม่ได้เพราะไม่มี partition key)
    PERFORM 1 FROM pg_constraint
      WHERE conname = part_name || '_pkey'
        AND conrelid = format('public.%I', part_name)::regclass;
    IF NOT FOUND THEN
      EXECUTE format('ALTER TABLE "public"."%I" ADD CONSTRAINT %I PRIMARY KEY ("id");',
                     part_name, part_name || '_pkey');
    END IF;

    cur_start := cur_end;
  END LOOP;

  -- ---------- tbl_devices_events ----------
  parent_table := 'tbl_devices_events';
  cur_start := start_bound;
  WHILE cur_start < end_bound LOOP
    cur_end   := cur_start + interval '60 days';
    part_name := format('%s_%s_to_%s',
      parent_table, to_char(cur_start,'YYYYMMDD'), to_char(cur_end,'YYYYMMDD'));

    EXECUTE format($SQL$
      CREATE TABLE IF NOT EXISTS "public"."%I"
      PARTITION OF "public"."%I"
      FOR VALUES FROM (%L) TO (%L);
      CREATE INDEX IF NOT EXISTS %I_created_at_idx ON "public"."%I"("created_at");
      CREATE INDEX IF NOT EXISTS %I_dev_type_created_idx ON "public"."%I"("device_id","type","created_at");
    $SQL$, part_name, parent_table, cur_start::date, cur_end::date,
          part_name, part_name, part_name, part_name);

    PERFORM 1 FROM pg_constraint
      WHERE conname = part_name || '_pkey'
        AND conrelid = format('public.%I', part_name)::regclass;
    IF NOT FOUND THEN
      EXECUTE format('ALTER TABLE "public"."%I" ADD CONSTRAINT %I PRIMARY KEY ("id");',
                     part_name, part_name || '_pkey');
    END IF;

    cur_start := cur_end;
  END LOOP;
END $$;
