CREATE TABLE "ledger_transactions" (
  "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
  "transaction_type" TEXT NOT NULL,
  "reference_type" TEXT,
  "reference_uuid" UUID,
  "description" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ledger_transactions_uuid_pkey" PRIMARY KEY ("uuid")
);

CREATE INDEX "ledger_transactions_reference_type_reference_uuid_idx"
ON "ledger_transactions"("reference_type", "reference_uuid");

ALTER TABLE "ledger_entries"
ADD COLUMN "transaction_uuid" UUID;

UPDATE "ledger_entries"
SET "transaction_uuid" = gen_random_uuid()
WHERE "transaction_uuid" IS NULL;

INSERT INTO "ledger_transactions" (
  "uuid",
  "transaction_type",
  "reference_type",
  "reference_uuid",
  "metadata"
)
SELECT DISTINCT
  "transaction_uuid",
  'legacy_import',
  "reference_type",
  "reference_uuid",
  jsonb_build_object('source', 'migration_202603280005_double_entry_ledger')
FROM "ledger_entries"
WHERE "transaction_uuid" IS NOT NULL;

ALTER TABLE "ledger_entries"
ALTER COLUMN "transaction_uuid" SET NOT NULL;

CREATE INDEX "ledger_entries_transaction_uuid_idx"
ON "ledger_entries"("transaction_uuid");

ALTER TABLE "ledger_entries"
ADD CONSTRAINT "ledger_entries_transaction_uuid_fkey"
FOREIGN KEY ("transaction_uuid") REFERENCES "ledger_transactions"("uuid")
ON DELETE CASCADE ON UPDATE CASCADE;
