/*
  Warnings:

  - You are about to alter the column `phone` on the `customers` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(10)`.

*/
-- CreateEnum
CREATE TYPE "TableRequestType" AS ENUM ('waiter', 'water', 'bill', 'clean');

-- CreateEnum
CREATE TYPE "TableRequestStatus" AS ENUM ('pending', 'resolved');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "created_by" UUID,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "coupons" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(10);

-- AlterTable
ALTER TABLE "floors" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payment_methods" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "promotions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "sessions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tables" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;
