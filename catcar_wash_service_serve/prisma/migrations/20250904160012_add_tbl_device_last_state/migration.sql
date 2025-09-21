-- CreateTable
CREATE TABLE "public"."tbl_devices_last_state" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "state_data" JSONB,
    "hash_state" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_devices_last_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_devices_last_state_device_id_key" ON "public"."tbl_devices_last_state"("device_id");

-- CreateIndex
CREATE INDEX "tbl_devices_last_state_device_id_idx" ON "public"."tbl_devices_last_state"("device_id");

-- AddForeignKey
ALTER TABLE "public"."tbl_devices_last_state" ADD CONSTRAINT "tbl_devices_last_state_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."tbl_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
