/*
  Warnings:

  - You are about to drop the column `attachment` on the `Knowledge` table. All the data in the column will be lost.
  - You are about to drop the column `attachment` on the `SupportMaterial` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Knowledge" DROP COLUMN "attachment",
ADD COLUMN     "anexo" BYTEA;

-- AlterTable
ALTER TABLE "SupportMaterial" DROP COLUMN "attachment",
ADD COLUMN     "anexo" BYTEA;
