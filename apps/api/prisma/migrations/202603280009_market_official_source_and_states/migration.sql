ALTER TABLE "market_rules"
    RENAME COLUMN "resolve_source" TO "official_source_label";

ALTER TABLE "market_rules"
    ADD COLUMN "official_source_url" TEXT NOT NULL DEFAULT 'https://example.com';
