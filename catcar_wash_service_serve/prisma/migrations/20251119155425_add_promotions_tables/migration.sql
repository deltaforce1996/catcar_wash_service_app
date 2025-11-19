/*
  Warnings:

  - You are about to drop the `tbl_devices_events_old` table. If the table is not empty, all the data it contains will be lost.

*/

-- CreateTable
CREATE TABLE "public"."tbl_promotions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discount_percent" DECIMAL(5,2) NOT NULL,
    "start_date" TIMESTAMPTZ(3) NOT NULL,
    "end_date" TIMESTAMPTZ(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tbl_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_promotion_users" (
    "id" TEXT NOT NULL,
    "promotion_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_promotion_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_promotions_is_active_idx" ON "public"."tbl_promotions"("is_active");

-- CreateIndex
CREATE INDEX "tbl_promotions_start_date_end_date_idx" ON "public"."tbl_promotions"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "tbl_promotion_users_promotion_id_idx" ON "public"."tbl_promotion_users"("promotion_id");

-- CreateIndex
CREATE INDEX "tbl_promotion_users_user_id_idx" ON "public"."tbl_promotion_users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_promotion_users_promotion_id_user_id_key" ON "public"."tbl_promotion_users"("promotion_id", "user_id");

-- AddForeignKey
ALTER TABLE "public"."tbl_promotion_users" ADD CONSTRAINT "tbl_promotion_users_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "public"."tbl_promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tbl_promotion_users" ADD CONSTRAINT "tbl_promotion_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
