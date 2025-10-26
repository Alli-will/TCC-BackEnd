BEGIN;

-- 1) Se já existir uma FK antiga na SearchDepartment que aponte para 'searches', remove
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'SearchDepartment'
      AND constraint_name = 'SearchDepartment_searchId_fkey'
  ) THEN
    ALTER TABLE "SearchDepartment" DROP CONSTRAINT "SearchDepartment_searchId_fkey";
  END IF;
END $$;

-- 2) Renomeia a tabela base 'searches' para 'survey' (se ainda existir com o nome antigo)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'searches'
  ) THEN
    ALTER TABLE "searches" RENAME TO "survey";
  END IF;
END $$;

-- 3) Garante a existência da tabela de junção com FKs para 'survey'
CREATE TABLE IF NOT EXISTS "SearchDepartment" (
  "id" SERIAL PRIMARY KEY,
  "searchId" INTEGER NOT NULL,
  "departmentId" INTEGER NOT NULL,
  CONSTRAINT "SearchDepartment_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "SearchDepartment_searchId_departmentId_key"
    UNIQUE ("searchId", "departmentId")
);

-- 4) Garante a FK correta de SearchDepartment -> survey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'SearchDepartment'
      AND constraint_name = 'SearchDepartment_searchId_fkey'
  ) THEN
    ALTER TABLE "SearchDepartment"
      ADD CONSTRAINT "SearchDepartment_searchId_fkey"
      FOREIGN KEY ("searchId")
      REFERENCES "survey"("id")
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

-- 5) Índices auxiliares (se não existirem)
CREATE INDEX IF NOT EXISTS "SearchDepartment_searchId_idx"
  ON "SearchDepartment" ("searchId");
CREATE INDEX IF NOT EXISTS "SearchDepartment_departmentId_idx"
  ON "SearchDepartment" ("departmentId");

-- 6) Backfill: cria vínculos na SearchDepartment com base no campo legado 'departmentId' da 'survey'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'survey' AND column_name = 'departmentId'
  ) THEN
    INSERT INTO "SearchDepartment" ("searchId", "departmentId")
    SELECT s."id", s."departmentId"
    FROM "survey" s
    WHERE s."departmentId" IS NOT NULL
    ON CONFLICT ("searchId", "departmentId") DO NOTHING;
  END IF;
END $$;

COMMIT;
