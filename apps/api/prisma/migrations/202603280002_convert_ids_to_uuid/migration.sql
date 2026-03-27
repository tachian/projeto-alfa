CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_user_id_fkey";
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_fkey";
ALTER TABLE "orders" DROP CONSTRAINT "orders_market_id_fkey";
ALTER TABLE "trades" DROP CONSTRAINT "trades_market_id_fkey";
ALTER TABLE "trades" DROP CONSTRAINT "trades_buy_order_id_fkey";
ALTER TABLE "trades" DROP CONSTRAINT "trades_sell_order_id_fkey";
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_user_id_fkey";
ALTER TABLE "ledger_entries" DROP CONSTRAINT "ledger_entries_account_id_fkey";
ALTER TABLE "ledger_entries" DROP CONSTRAINT "ledger_entries_user_id_fkey";

ALTER TABLE "users"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "markets"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "orders"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "user_id" TYPE UUID USING "user_id"::uuid,
  ALTER COLUMN "market_id" TYPE UUID USING "market_id"::uuid,
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "trades"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "market_id" TYPE UUID USING "market_id"::uuid,
  ALTER COLUMN "buy_order_id" TYPE UUID USING "buy_order_id"::uuid,
  ALTER COLUMN "sell_order_id" TYPE UUID USING "sell_order_id"::uuid,
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "accounts"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "user_id" TYPE UUID USING "user_id"::uuid,
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "ledger_entries"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "account_id" TYPE UUID USING "account_id"::uuid,
  ALTER COLUMN "user_id" TYPE UUID USING "user_id"::uuid,
  ALTER COLUMN "reference_id" TYPE UUID USING "reference_id"::uuid,
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "refresh_tokens"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "user_id" TYPE UUID USING "user_id"::uuid,
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "audit_logs"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
  ALTER COLUMN "target_id" TYPE UUID USING "target_id"::uuid,
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "refresh_tokens"
ADD CONSTRAINT "refresh_tokens_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "orders"
ADD CONSTRAINT "orders_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "orders"
ADD CONSTRAINT "orders_market_id_fkey"
FOREIGN KEY ("market_id") REFERENCES "markets"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trades"
ADD CONSTRAINT "trades_market_id_fkey"
FOREIGN KEY ("market_id") REFERENCES "markets"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trades"
ADD CONSTRAINT "trades_buy_order_id_fkey"
FOREIGN KEY ("buy_order_id") REFERENCES "orders"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trades"
ADD CONSTRAINT "trades_sell_order_id_fkey"
FOREIGN KEY ("sell_order_id") REFERENCES "orders"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "accounts"
ADD CONSTRAINT "accounts_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ledger_entries"
ADD CONSTRAINT "ledger_entries_account_id_fkey"
FOREIGN KEY ("account_id") REFERENCES "accounts"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ledger_entries"
ADD CONSTRAINT "ledger_entries_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
