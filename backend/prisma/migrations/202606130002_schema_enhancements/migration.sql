CREATE TYPE "BookingStatus" AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

ALTER TABLE "sessions" ADD COLUMN "is_open" BOOLEAN NOT NULL DEFAULT true;
UPDATE "sessions" SET "is_open" = false WHERE "closed_at" IS NOT NULL;

ALTER TABLE "orders" ADD COLUMN "coupon_id" UUID;
ALTER TABLE "orders" ADD COLUMN "receipt_sent_at" TIMESTAMP(3);

DROP INDEX IF EXISTS "customers_email_idx";

CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");
CREATE INDEX "sessions_is_open_idx" ON "sessions"("is_open");
CREATE INDEX "orders_coupon_id_idx" ON "orders"("coupon_id");

CREATE TABLE "bookings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "customer_id" UUID,
  "table_id" UUID,
  "booking_date" TIMESTAMP(3) NOT NULL,
  "guest_count" INTEGER NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'pending',
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bookings_customer_id_idx" ON "bookings"("customer_id");
CREATE INDEX "bookings_table_id_idx" ON "bookings"("table_id");
CREATE INDEX "bookings_booking_date_idx" ON "bookings"("booking_date");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
