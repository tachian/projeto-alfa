CREATE TABLE "market_resolutions" (
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "market_uuid" UUID NOT NULL,
    "winning_outcome" TEXT,
    "source_value" TEXT,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "resolved_by_user_uuid" UUID,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_resolutions_pkey" PRIMARY KEY ("uuid")
);

CREATE TABLE "settlement_runs" (
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "market_uuid" UUID NOT NULL,
    "market_resolution_uuid" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "contracts_processed" INTEGER NOT NULL DEFAULT 0,
    "total_payout" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlement_runs_pkey" PRIMARY KEY ("uuid")
);

CREATE INDEX "market_resolutions_market_uuid_created_at_idx" ON "market_resolutions"("market_uuid", "created_at");
CREATE INDEX "market_resolutions_status_created_at_idx" ON "market_resolutions"("status", "created_at");
CREATE INDEX "settlement_runs_market_uuid_created_at_idx" ON "settlement_runs"("market_uuid", "created_at");
CREATE INDEX "settlement_runs_market_resolution_uuid_idx" ON "settlement_runs"("market_resolution_uuid");
CREATE INDEX "settlement_runs_status_created_at_idx" ON "settlement_runs"("status", "created_at");

ALTER TABLE "market_resolutions"
ADD CONSTRAINT "market_resolutions_market_uuid_fkey"
FOREIGN KEY ("market_uuid") REFERENCES "markets"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "settlement_runs"
ADD CONSTRAINT "settlement_runs_market_uuid_fkey"
FOREIGN KEY ("market_uuid") REFERENCES "markets"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "settlement_runs"
ADD CONSTRAINT "settlement_runs_market_resolution_uuid_fkey"
FOREIGN KEY ("market_resolution_uuid") REFERENCES "market_resolutions"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
