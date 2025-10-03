-- CreateEnum
CREATE TYPE "public"."PaymentApiStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."tbl_payment_temps" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "status" "public"."PaymentApiStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_payment_temps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_payment_temps_device_id_idx" ON "public"."tbl_payment_temps"("device_id");

-- CreateIndex
CREATE INDEX "tbl_payment_temps_status_idx" ON "public"."tbl_payment_temps"("status");

-- CreateIndex
CREATE INDEX "tbl_payment_temps_reference_id_idx" ON "public"."tbl_payment_temps"("reference_id");

-- AddForeignKey
ALTER TABLE "public"."tbl_payment_temps" ADD CONSTRAINT "tbl_payment_temps_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."tbl_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
