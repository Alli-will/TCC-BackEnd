/*
  Warnings:

  - You are about to drop the column `comment` on the `PulseResponse` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `PulseResponse` table. All the data in the column will be lost.
  - Added the required column `answers` to the `PulseResponse` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PulseResponse" DROP COLUMN "comment",
DROP COLUMN "score",
ADD COLUMN     "answers" JSONB NOT NULL;
