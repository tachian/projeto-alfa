CREATE TABLE "market_rules" (
    "market_uuid" UUID NOT NULL,
    "resolve_source" TEXT NOT NULL,
    "resolution_rules" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_rules_pkey" PRIMARY KEY ("market_uuid")
);

ALTER TABLE "market_rules"
    ADD CONSTRAINT "market_rules_market_uuid_fkey"
    FOREIGN KEY ("market_uuid")
    REFERENCES "markets"("uuid")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
