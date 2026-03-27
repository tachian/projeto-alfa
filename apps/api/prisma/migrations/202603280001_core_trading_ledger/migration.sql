CREATE TABLE "markets" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "outcome_type" TEXT NOT NULL DEFAULT 'binary',
  "contract_value" DECIMAL(12,2) NOT NULL DEFAULT 1,
  "tick_size" INTEGER NOT NULL DEFAULT 1,
  "open_at" TIMESTAMP(3),
  "close_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "markets_slug_key" ON "markets"("slug");
CREATE INDEX "markets_status_close_at_idx" ON "markets"("status", "close_at");

CREATE TABLE "orders" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "market_id" TEXT NOT NULL,
  "side" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "order_type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "remaining_quantity" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "canceled_at" TIMESTAMP(3),

  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "orders_market_id_status_price_created_at_idx" ON "orders"("market_id", "status", "price", "created_at");
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");

CREATE TABLE "trades" (
  "id" TEXT NOT NULL,
  "market_id" TEXT NOT NULL,
  "buy_order_id" TEXT NOT NULL,
  "sell_order_id" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "fee_buy" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "fee_sell" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trades_market_id_executed_at_idx" ON "trades"("market_id", "executed_at");
CREATE INDEX "trades_buy_order_id_idx" ON "trades"("buy_order_id");
CREATE INDEX "trades_sell_order_id_idx" ON "trades"("sell_order_id");

CREATE TABLE "accounts" (
  "id" TEXT NOT NULL,
  "user_id" TEXT,
  "account_type" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");
CREATE UNIQUE INDEX "accounts_user_id_account_type_currency_key" ON "accounts"("user_id", "account_type", "currency");

CREATE TABLE "ledger_entries" (
  "id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "user_id" TEXT,
  "entry_type" TEXT NOT NULL,
  "amount" DECIMAL(18,4) NOT NULL,
  "direction" TEXT NOT NULL,
  "reference_type" TEXT NOT NULL,
  "reference_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ledger_entries_account_id_created_at_idx" ON "ledger_entries"("account_id", "created_at");
CREATE INDEX "ledger_entries_user_id_created_at_idx" ON "ledger_entries"("user_id", "created_at");
CREATE INDEX "ledger_entries_reference_type_reference_id_idx" ON "ledger_entries"("reference_type", "reference_id");

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
