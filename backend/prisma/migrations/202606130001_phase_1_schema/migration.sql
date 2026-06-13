CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "Role" AS ENUM ('admin', 'employee');
CREATE TYPE "UnitOfMeasure" AS ENUM ('per_piece', 'per_kg', 'per_litre');
CREATE TYPE "PaymentMethodType" AS ENUM ('cash', 'card', 'upi');
CREATE TYPE "OrderStatus" AS ENUM ('draft', 'paid', 'cancelled');
CREATE TYPE "KdsStage" AS ENUM ('to_cook', 'preparing', 'completed');
CREATE TYPE "DiscountType" AS ENUM ('percentage', 'fixed');
CREATE TYPE "PromotionAppliedTo" AS ENUM ('product', 'order');

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "role" "Role" NOT NULL,
  "is_archived" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "color" VARCHAR(20) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "category_id" UUID NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "unit_of_measure" "UnitOfMeasure" NOT NULL,
  "tax_percent" DECIMAL(5,2) NOT NULL,
  "description" TEXT,
  "show_on_kds" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_methods" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "method" "PaymentMethodType" NOT NULL,
  "is_enabled" BOOLEAN NOT NULL DEFAULT false,
  "upi_id" VARCHAR(255),
  CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "floors" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  CONSTRAINT "floors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tables" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "floor_id" UUID NOT NULL,
  "table_number" INTEGER NOT NULL,
  "seat_count" INTEGER NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "opened_by" UUID NOT NULL,
  "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closed_at" TIMESTAMP(3),
  "closing_revenue" DECIMAL(10,2),
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255),
  "phone" VARCHAR(50),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_number" SERIAL NOT NULL,
  "session_id" UUID NOT NULL,
  "table_id" UUID,
  "customer_id" UUID,
  "employee_id" UUID NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'draft',
  "subtotal" DECIMAL(10,2) NOT NULL,
  "tax_amount" DECIMAL(10,2) NOT NULL,
  "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(10,2) NOT NULL,
  "payment_method" "PaymentMethodType",
  "payment_reference" VARCHAR(255),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paid_at" TIMESTAMP(3),
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "product_name" VARCHAR(255) NOT NULL,
  "unit_price" DECIMAL(10,2) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "tax_percent" DECIMAL(5,2) NOT NULL,
  "line_discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "line_total" DECIMAL(10,2) NOT NULL,
  "kds_stage" "KdsStage" NOT NULL DEFAULT 'to_cook',
  "kds_item_done" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "coupons" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" VARCHAR(100) NOT NULL,
  "discount_type" "DiscountType" NOT NULL,
  "discount_value" DECIMAL(10,2) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "promotions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "applied_to" "PromotionAppliedTo" NOT NULL,
  "product_id" UUID,
  "min_quantity" INTEGER,
  "min_order_amount" DECIMAL(10,2),
  "discount_type" "DiscountType" NOT NULL,
  "discount_value" DECIMAL(10,2) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_is_archived_idx" ON "users"("is_archived");
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE INDEX "products_category_id_idx" ON "products"("category_id");
CREATE INDEX "products_name_idx" ON "products"("name");
CREATE UNIQUE INDEX "payment_methods_method_key" ON "payment_methods"("method");
CREATE UNIQUE INDEX "tables_floor_id_table_number_key" ON "tables"("floor_id", "table_number");
CREATE INDEX "tables_floor_id_idx" ON "tables"("floor_id");
CREATE INDEX "sessions_opened_by_idx" ON "sessions"("opened_by");
CREATE INDEX "sessions_closed_at_idx" ON "sessions"("closed_at");
CREATE INDEX "customers_email_idx" ON "customers"("email");
CREATE INDEX "customers_phone_idx" ON "customers"("phone");
CREATE INDEX "orders_session_id_idx" ON "orders"("session_id");
CREATE INDEX "orders_table_id_idx" ON "orders"("table_id");
CREATE INDEX "orders_customer_id_idx" ON "orders"("customer_id");
CREATE INDEX "orders_employee_id_idx" ON "orders"("employee_id");
CREATE INDEX "orders_status_idx" ON "orders"("status");
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");
CREATE INDEX "order_items_kds_stage_idx" ON "order_items"("kds_stage");
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");
CREATE INDEX "coupons_is_active_idx" ON "coupons"("is_active");
CREATE INDEX "promotions_product_id_idx" ON "promotions"("product_id");
CREATE INDEX "promotions_applied_to_idx" ON "promotions"("applied_to");
CREATE INDEX "promotions_is_active_idx" ON "promotions"("is_active");

ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tables" ADD CONSTRAINT "tables_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "floors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_opened_by_fkey" FOREIGN KEY ("opened_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
