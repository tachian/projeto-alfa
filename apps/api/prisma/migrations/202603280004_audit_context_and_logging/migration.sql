ALTER TABLE "audit_logs"
ADD COLUMN "request_uuid" UUID,
ADD COLUMN "actor_uuid" UUID,
ADD COLUMN "ip_address" TEXT,
ADD COLUMN "user_agent" TEXT;

CREATE INDEX "audit_logs_request_uuid_idx" ON "audit_logs"("request_uuid");
CREATE INDEX "audit_logs_actor_uuid_created_at_idx" ON "audit_logs"("actor_uuid", "created_at");
