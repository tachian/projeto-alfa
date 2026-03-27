ALTER TABLE "users" RENAME COLUMN "id" TO "uuid";

ALTER TABLE "markets" RENAME COLUMN "id" TO "uuid";

ALTER TABLE "orders" RENAME COLUMN "id" TO "uuid";
ALTER TABLE "orders" RENAME COLUMN "user_id" TO "user_uuid";
ALTER TABLE "orders" RENAME COLUMN "market_id" TO "market_uuid";

ALTER TABLE "trades" RENAME COLUMN "id" TO "uuid";
ALTER TABLE "trades" RENAME COLUMN "market_id" TO "market_uuid";
ALTER TABLE "trades" RENAME COLUMN "buy_order_id" TO "buy_order_uuid";
ALTER TABLE "trades" RENAME COLUMN "sell_order_id" TO "sell_order_uuid";

ALTER TABLE "accounts" RENAME COLUMN "id" TO "uuid";
ALTER TABLE "accounts" RENAME COLUMN "user_id" TO "user_uuid";

ALTER TABLE "ledger_entries" RENAME COLUMN "id" TO "uuid";
ALTER TABLE "ledger_entries" RENAME COLUMN "account_id" TO "account_uuid";
ALTER TABLE "ledger_entries" RENAME COLUMN "user_id" TO "user_uuid";
ALTER TABLE "ledger_entries" RENAME COLUMN "reference_id" TO "reference_uuid";

ALTER TABLE "refresh_tokens" RENAME COLUMN "id" TO "uuid";
ALTER TABLE "refresh_tokens" RENAME COLUMN "user_id" TO "user_uuid";

ALTER TABLE "audit_logs" RENAME COLUMN "id" TO "uuid";
ALTER TABLE "audit_logs" RENAME COLUMN "target_id" TO "target_uuid";

ALTER INDEX "orders_market_id_status_price_created_at_idx" RENAME TO "orders_market_uuid_status_price_created_at_idx";
ALTER INDEX "orders_user_id_created_at_idx" RENAME TO "orders_user_uuid_created_at_idx";
ALTER INDEX "trades_market_id_executed_at_idx" RENAME TO "trades_market_uuid_executed_at_idx";
ALTER INDEX "trades_buy_order_id_idx" RENAME TO "trades_buy_order_uuid_idx";
ALTER INDEX "trades_sell_order_id_idx" RENAME TO "trades_sell_order_uuid_idx";
ALTER INDEX "accounts_user_id_idx" RENAME TO "accounts_user_uuid_idx";
ALTER INDEX "accounts_user_id_account_type_currency_key" RENAME TO "accounts_user_uuid_account_type_currency_key";
ALTER INDEX "ledger_entries_account_id_created_at_idx" RENAME TO "ledger_entries_account_uuid_created_at_idx";
ALTER INDEX "ledger_entries_user_id_created_at_idx" RENAME TO "ledger_entries_user_uuid_created_at_idx";
ALTER INDEX "ledger_entries_reference_type_reference_id_idx" RENAME TO "ledger_entries_reference_type_reference_uuid_idx";
ALTER INDEX "refresh_tokens_user_id_idx" RENAME TO "refresh_tokens_user_uuid_idx";

ALTER TABLE "refresh_tokens" RENAME CONSTRAINT "refresh_tokens_pkey" TO "refresh_tokens_uuid_pkey";
ALTER TABLE "refresh_tokens" RENAME CONSTRAINT "refresh_tokens_user_id_fkey" TO "refresh_tokens_user_uuid_fkey";
ALTER TABLE "users" RENAME CONSTRAINT "users_pkey" TO "users_uuid_pkey";
ALTER TABLE "markets" RENAME CONSTRAINT "markets_pkey" TO "markets_uuid_pkey";
ALTER TABLE "orders" RENAME CONSTRAINT "orders_pkey" TO "orders_uuid_pkey";
ALTER TABLE "orders" RENAME CONSTRAINT "orders_user_id_fkey" TO "orders_user_uuid_fkey";
ALTER TABLE "orders" RENAME CONSTRAINT "orders_market_id_fkey" TO "orders_market_uuid_fkey";
ALTER TABLE "trades" RENAME CONSTRAINT "trades_pkey" TO "trades_uuid_pkey";
ALTER TABLE "trades" RENAME CONSTRAINT "trades_market_id_fkey" TO "trades_market_uuid_fkey";
ALTER TABLE "trades" RENAME CONSTRAINT "trades_buy_order_id_fkey" TO "trades_buy_order_uuid_fkey";
ALTER TABLE "trades" RENAME CONSTRAINT "trades_sell_order_id_fkey" TO "trades_sell_order_uuid_fkey";
ALTER TABLE "accounts" RENAME CONSTRAINT "accounts_pkey" TO "accounts_uuid_pkey";
ALTER TABLE "accounts" RENAME CONSTRAINT "accounts_user_id_fkey" TO "accounts_user_uuid_fkey";
ALTER TABLE "ledger_entries" RENAME CONSTRAINT "ledger_entries_pkey" TO "ledger_entries_uuid_pkey";
ALTER TABLE "ledger_entries" RENAME CONSTRAINT "ledger_entries_account_id_fkey" TO "ledger_entries_account_uuid_fkey";
ALTER TABLE "ledger_entries" RENAME CONSTRAINT "ledger_entries_user_id_fkey" TO "ledger_entries_user_uuid_fkey";
ALTER TABLE "audit_logs" RENAME CONSTRAINT "audit_logs_pkey" TO "audit_logs_uuid_pkey";
