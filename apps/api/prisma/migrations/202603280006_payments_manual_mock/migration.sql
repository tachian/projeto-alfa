CREATE TABLE "payments" (
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_uuid" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "metadata" JSONB,
    "ledger_transaction_uuid" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("uuid")
);

CREATE UNIQUE INDEX "payments_ledger_transaction_uuid_key" ON "payments"("ledger_transaction_uuid");
CREATE INDEX "payments_user_uuid_type_created_at_idx" ON "payments"("user_uuid", "type", "created_at");
CREATE INDEX "payments_status_created_at_idx" ON "payments"("status", "created_at");

ALTER TABLE "payments"
    ADD CONSTRAINT "payments_user_uuid_fkey"
    FOREIGN KEY ("user_uuid")
    REFERENCES "users"("uuid")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE "payments"
    ADD CONSTRAINT "payments_ledger_transaction_uuid_fkey"
    FOREIGN KEY ("ledger_transaction_uuid")
    REFERENCES "ledger_transactions"("uuid")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
