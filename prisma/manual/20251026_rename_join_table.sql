BEGIN;

-- Renomear tabela de junção SearchDepartment -> survey_department (minúsculo, snake_case)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'SearchDepartment'
  ) THEN
    ALTER TABLE "SearchDepartment" RENAME TO "survey_department";
  END IF;
END $$;

-- Garantir que a FK para department existe e aponta corretamente
DO $$
BEGIN
  -- Se existir uma constraint antiga com outro nome, tentamos dropar pela conhecida
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'survey_department'
      AND constraint_name = 'SearchDepartment_departmentId_fkey'
  ) THEN
    ALTER TABLE "survey_department" DROP CONSTRAINT "SearchDepartment_departmentId_fkey";
  END IF;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- (Re)criar FK department
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'survey_department'
      AND constraint_name = 'survey_department_departmentId_fkey'
  ) THEN
    ALTER TABLE "survey_department"
      ADD CONSTRAINT "survey_department_departmentId_fkey"
      FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

-- Garantir FK para survey (tabela base já renomeada anteriormente)
DO $$
BEGIN
  -- Drop de constraint antiga se existir com nome legado
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'survey_department'
      AND constraint_name = 'SearchDepartment_searchId_fkey'
  ) THEN
    ALTER TABLE "survey_department" DROP CONSTRAINT "SearchDepartment_searchId_fkey";
  END IF;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'survey_department'
      AND constraint_name = 'survey_department_searchId_fkey'
  ) THEN
    ALTER TABLE "survey_department"
      ADD CONSTRAINT "survey_department_searchId_fkey"
      FOREIGN KEY ("searchId") REFERENCES "survey"("id")
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

-- Garantir unique e índices
DO $$
BEGIN
  -- Unique (searchId, departmentId)
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'SurveyDepartment_searchId_departmentId_key'
  ) THEN
    -- Caso constraint antiga exista com esse nome, ignorar; criaremos a unique moderna via constraint
    NULL;
  END IF;
END $$;

-- Cria a unique (se não existir) com novo nome coerente
DO $$
BEGIN
  -- Verifica se já existe uma unique com os mesmos campos
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_schema = 'public' AND tc.table_name = 'survey_department'
      AND tc.constraint_type = 'UNIQUE'
      AND ccu.column_name IN ('searchId','departmentId')
  ) THEN
    ALTER TABLE "survey_department"
    ADD CONSTRAINT "survey_department_searchId_departmentId_key"
    UNIQUE ("searchId", "departmentId");
  END IF;
END $$;

-- Índices auxiliares
CREATE INDEX IF NOT EXISTS "survey_department_searchId_idx" ON "survey_department" ("searchId");
CREATE INDEX IF NOT EXISTS "survey_department_departmentId_idx" ON "survey_department" ("departmentId");

COMMIT;
