-- Drop global unique if exists and create composite unique per company
DO $$ BEGIN
  ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_internal_id_key";
EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- Normalize internal_id sequence inside each company (admins/support with null companyId left untouched)
DO $$ DECLARE
  rec RECORD;
  r2 RECORD;
  counter INT;
BEGIN
  FOR rec IN SELECT DISTINCT "companyId" FROM "User" WHERE "companyId" IS NOT NULL LOOP
    counter := 0;
    FOR r2 IN SELECT id FROM "User" WHERE "companyId" = rec."companyId" ORDER BY internal_id, id LOOP
      counter := counter + 1;
      UPDATE "User" SET internal_id = counter WHERE id = r2.id;
    END LOOP;
  END LOOP;
END $$;

-- Add composite unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'User' AND c.conname = 'User_company_internal_id_key'
  ) THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_company_internal_id_key" UNIQUE ("companyId", internal_id);
  END IF;
END $$;
