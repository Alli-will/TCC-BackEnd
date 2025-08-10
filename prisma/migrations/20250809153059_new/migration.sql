/*
  Warnings:

  - You are about to drop the column `answer` on the `ClimaResponse` table. All the data in the column will be lost.
  - You are about to drop the column `question` on the `ClimaResponse` table. All the data in the column will be lost.
  - Added the required column `answers` to the `ClimaResponse` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ClimaResponse" DROP COLUMN "answer",
DROP COLUMN "question",
ADD COLUMN     "answers" JSONB NOT NULL;
