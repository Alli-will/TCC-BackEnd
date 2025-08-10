/*
  Warnings:

  - You are about to drop the `Question` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `perguntas` on table `searches` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_searchId_fkey";

-- AlterTable
ALTER TABLE "searches" ALTER COLUMN "perguntas" SET NOT NULL;

-- DropTable
DROP TABLE "Question";
