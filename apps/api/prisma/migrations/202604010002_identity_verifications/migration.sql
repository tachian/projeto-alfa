CREATE TABLE "identity_verifications" (
  "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_uuid" UUID NOT NULL,
  "provider" TEXT NOT NULL,
  "provider_reference" TEXT,
  "verification_type" TEXT NOT NULL DEFAULT 'individual',
  "status" TEXT NOT NULL,
  "aml_status" TEXT NOT NULL DEFAULT 'pending',
  "risk_level" TEXT NOT NULL DEFAULT 'unknown',
  "full_name" TEXT NOT NULL,
  "document_type" TEXT NOT NULL,
  "document_number" TEXT NOT NULL,
  "country_code" TEXT NOT NULL,
  "birth_date" TIMESTAMPTZ,
  "reviewed_at" TIMESTAMPTZ,
  "requirements" JSONB,
  "provider_payload" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "identity_verifications_pkey" PRIMARY KEY ("uuid"),
  CONSTRAINT "identity_verifications_user_uuid_fkey"
    FOREIGN KEY ("user_uuid") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "identity_verifications_user_uuid_created_at_idx"
  ON "identity_verifications"("user_uuid", "created_at");

CREATE INDEX "identity_verifications_status_created_at_idx"
  ON "identity_verifications"("status", "created_at");

CREATE INDEX "identity_verifications_provider_provider_reference_idx"
  ON "identity_verifications"("provider", "provider_reference");
