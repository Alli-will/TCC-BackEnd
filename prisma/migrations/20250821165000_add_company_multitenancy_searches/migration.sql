-- Add companyId to searches, PulseResponse, ClimaResponse if missing
-- Also add company FKs and backfill where possible via user.companyId

-- 1. Add column companyId to searches if not exists
ALTER TABLE "searches" ADD COLUMN IF NOT EXISTS "companyId" INTEGER;
ALTER TABLE "PulseResponse" ADD COLUMN IF NOT EXISTS "companyId" INTEGER;
ALTER TABLE "ClimaResponse" ADD COLUMN IF NOT EXISTS "companyId" INTEGER;

-- 2. Add foreign keys (drop existing if already there to avoid duplicates)
DO $$
BEGIN
  -- searches.companyId FK
  IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'searches_companyId_fkey') THEN
    ALTER TABLE "searches" ADD CONSTRAINT "searches_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  -- PulseResponse.companyId FK
  IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'PulseResponse_companyId_fkey') THEN
    ALTER TABLE "PulseResponse" ADD CONSTRAINT "PulseResponse_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  -- ClimaResponse.companyId FK
  IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'ClimaResponse_companyId_fkey') THEN
    ALTER TABLE "ClimaResponse" ADD CONSTRAINT "ClimaResponse_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;

-- 3. Backfill response companyId from user.companyId when null
UPDATE "PulseResponse" pr SET "companyId" = u."companyId"
FROM "User" u
WHERE pr."companyId" IS NULL AND pr."userId" = u."id" AND u."companyId" IS NOT NULL;

UPDATE "ClimaResponse" cr SET "companyId" = u."companyId"
FROM "User" u
WHERE cr."companyId" IS NULL AND cr."userId" = u."id" AND u."companyId" IS NOT NULL;

-- 4. (Optional) Backfill searches.companyId if todas as respostas associadas pertencem a mesma empresa e campo está nulo
WITH search_company AS (
  SELECT s.id AS search_id,
         COALESCE(MAX(pr."companyId"), MAX(cr."companyId")) AS any_company,
         COUNT(DISTINCT pr."companyId") FILTER (WHERE pr."companyId" IS NOT NULL) + COUNT(DISTINCT cr."companyId") FILTER (WHERE cr."companyId" IS NOT NULL) AS distinct_companies
  FROM "searches" s
  LEFT JOIN "PulseResponse" pr ON pr."pesquisaId" = s.id
  LEFT JOIN "ClimaResponse" cr ON cr."pesquisaId" = s.id
  GROUP BY s.id
)
UPDATE "searches" s SET "companyId" = sc.any_company
FROM search_company sc
WHERE s.id = sc.search_id AND s."companyId" IS NULL AND sc.any_company IS NOT NULL AND sc.distinct_companies = 1;
