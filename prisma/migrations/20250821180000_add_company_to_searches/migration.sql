-- Add companyId to searches, pulse and clima responses
ALTER TABLE "searches" ADD COLUMN IF NOT EXISTS "companyId" INTEGER;
ALTER TABLE "PulseResponse" ADD COLUMN IF NOT EXISTS "companyId" INTEGER;
ALTER TABLE "ClimaResponse" ADD COLUMN IF NOT EXISTS "companyId" INTEGER;

-- Optionally backfill using user's company for responses (PostgreSQL syntax)
UPDATE "PulseResponse" pr SET "companyId" = u."companyId" FROM "User" u WHERE pr."userId" = u."id" AND pr."companyId" IS NULL;
UPDATE "ClimaResponse" cr SET "companyId" = u."companyId" FROM "User" u WHERE cr."userId" = u."id" AND cr."companyId" IS NULL;

-- (Searches) Cannot infer automatically; keep null until future creation logic sets it.

-- Add FKs (ignore if already)
DO $$ BEGIN
  ALTER TABLE "searches" ADD CONSTRAINT "searches_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PulseResponse" ADD CONSTRAINT "PulseResponse_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ClimaResponse" ADD CONSTRAINT "ClimaResponse_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
