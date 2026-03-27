ALTER TABLE "payments"
    ADD COLUMN "idempotency_key" TEXT;

CREATE UNIQUE INDEX "payments_user_uuid_type_idempotency_key_key"
    ON "payments"("user_uuid", "type", "idempotency_key");
