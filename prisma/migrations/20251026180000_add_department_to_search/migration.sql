ALTER TABLE "searches"
ADD COLUMN "departmentId" INTEGER;

ALTER TABLE "searches"
ADD CONSTRAINT "searches_departmentId_fkey"
FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
ON UPDATE CASCADE
ON DELETE SET NULL;
