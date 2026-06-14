-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('available', 'occupied', 'preparing', 'ready_to_serve', 'completed');

-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'arrived';

-- AlterEnum
ALTER TYPE "KdsStage" ADD VALUE 'ready';

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'sent_to_kitchen';
ALTER TYPE "OrderStatus" ADD VALUE 'preparing';
ALTER TYPE "OrderStatus" ADD VALUE 'ready';
ALTER TYPE "OrderStatus" ADD VALUE 'served';
ALTER TYPE "OrderStatus" ADD VALUE 'completed';
ALTER TYPE "OrderStatus" ADD VALUE 'refunded';

-- AlterTable
ALTER TABLE "tables" ADD COLUMN "occupied_seats" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "tables" ADD COLUMN "status" "TableStatus" NOT NULL DEFAULT 'available';

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "old_status" "OrderStatus",
    "new_status" "OrderStatus" NOT NULL,
    "changed_by" UUID,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refunds" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "refund_reason" TEXT NOT NULL,
    "refund_amount" DECIMAL(10,2) NOT NULL,
    "refund_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refunded_by" UUID NOT NULL,
    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_method" "PaymentMethodType" NOT NULL,
    "transaction_reference" VARCHAR(255),
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(255) NOT NULL,
    "entity_type" VARCHAR(255) NOT NULL,
    "entity_id" UUID,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "role" "Role",
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "type" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "table_status_history" (
    "id" UUID NOT NULL,
    "table_id" UUID NOT NULL,
    "old_status" "TableStatus",
    "new_status" "TableStatus" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "table_status_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "table_requests" (
    "id" UUID NOT NULL,
    "table_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "table_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_status_history_order_id_idx" ON "order_status_history"("order_id");
CREATE INDEX "refunds_order_id_idx" ON "refunds"("order_id");
CREATE INDEX "refunds_refunded_by_idx" ON "refunds"("refunded_by");
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");
CREATE INDEX "activity_logs_entity_type_entity_id_idx" ON "activity_logs"("entity_type", "entity_id");
CREATE INDEX "activity_logs_timestamp_idx" ON "activity_logs"("timestamp");
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_role_idx" ON "notifications"("role");
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");
CREATE INDEX "table_status_history_table_id_idx" ON "table_status_history"("table_id");
CREATE INDEX "table_requests_table_id_idx" ON "table_requests"("table_id");
CREATE INDEX "table_requests_status_idx" ON "table_requests"("status");
CREATE INDEX "order_items_kds_stage_kds_item_done_idx" ON "order_items"("kds_stage", "kds_item_done");
CREATE INDEX "orders_session_id_status_created_at_idx" ON "orders"("session_id", "status", "created_at");
CREATE INDEX "sessions_is_open_opened_at_idx" ON "sessions"("is_open", "opened_at");
CREATE INDEX "users_email_is_archived_idx" ON "users"("email", "is_archived");

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_refunded_by_fkey" FOREIGN KEY ("refunded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "table_status_history" ADD CONSTRAINT "table_status_history_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "table_requests" ADD CONSTRAINT "table_requests_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
