/*
  Warnings:

  - Added the required column `pesquisaId` to the `ClimaResponse` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pesquisaId` to the `PulseResponse` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ClimaResponse" ADD COLUMN     "pesquisaId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PulseResponse" ADD COLUMN     "pesquisaId" INTEGER NOT NULL;
