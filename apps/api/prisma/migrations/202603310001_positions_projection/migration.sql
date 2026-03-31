CREATE TABLE "positions" (
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_uuid" UUID NOT NULL,
    "market_uuid" UUID NOT NULL,
    "outcome" TEXT NOT NULL,
    "net_quantity" INTEGER NOT NULL DEFAULT 0,
    "average_entry_price" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("uuid")
);

CREATE UNIQUE INDEX "positions_user_uuid_market_uuid_outcome_key" ON "positions"("user_uuid", "market_uuid", "outcome");
CREATE INDEX "positions_market_uuid_outcome_idx" ON "positions"("market_uuid", "outcome");
CREATE INDEX "positions_user_uuid_updated_at_idx" ON "positions"("user_uuid", "updated_at");

ALTER TABLE "positions"
ADD CONSTRAINT "positions_user_uuid_fkey"
FOREIGN KEY ("user_uuid") REFERENCES "users"("uuid")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "positions"
ADD CONSTRAINT "positions_market_uuid_fkey"
FOREIGN KEY ("market_uuid") REFERENCES "markets"("uuid")
ON DELETE CASCADE ON UPDATE CASCADE;
