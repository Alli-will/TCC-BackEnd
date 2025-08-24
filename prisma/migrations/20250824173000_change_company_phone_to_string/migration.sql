-- Manual migration: change Company.phone from Int to String (text)
-- Adjust column type; existing integer values will be cast to text.
ALTER TABLE "Company" ALTER COLUMN "phone" TYPE text USING "phone"::text;
