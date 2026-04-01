CREATE TABLE "position_settlements" (
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "settlement_run_uuid" UUID NOT NULL,
    "position_uuid" UUID NOT NULL,
    "user_uuid" UUID NOT NULL,
    "market_uuid" UUID NOT NULL,
    "outcome" TEXT NOT NULL,
    "winning_outcome" TEXT NOT NULL,
    "position_direction" TEXT NOT NULL,
    "contracts_settled" INTEGER NOT NULL,
    "payout_amount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "realized_pnl_delta" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "position_settlements_pkey" PRIMARY KEY ("uuid")
);

CREATE INDEX "position_settlements_user_uuid_created_at_idx" ON "position_settlements"("user_uuid", "created_at");
CREATE INDEX "position_settlements_market_uuid_created_at_idx" ON "position_settlements"("market_uuid", "created_at");
CREATE INDEX "position_settlements_settlement_run_uuid_idx" ON "position_settlements"("settlement_run_uuid");

ALTER TABLE "position_settlements"
ADD CONSTRAINT "position_settlements_settlement_run_uuid_fkey"
FOREIGN KEY ("settlement_run_uuid") REFERENCES "settlement_runs"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "position_settlements"
ADD CONSTRAINT "position_settlements_position_uuid_fkey"
FOREIGN KEY ("position_uuid") REFERENCES "positions"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "position_settlements"
ADD CONSTRAINT "position_settlements_user_uuid_fkey"
FOREIGN KEY ("user_uuid") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "position_settlements"
ADD CONSTRAINT "position_settlements_market_uuid_fkey"
FOREIGN KEY ("market_uuid") REFERENCES "markets"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
