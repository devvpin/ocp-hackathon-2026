-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('dine_in', 'pickup');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "order_type" "OrderType" NOT NULL DEFAULT 'dine_in';
ALTER TABLE "orders" ADD COLUMN "kitchen_completed" BOOLEAN NOT NULL DEFAULT false;
