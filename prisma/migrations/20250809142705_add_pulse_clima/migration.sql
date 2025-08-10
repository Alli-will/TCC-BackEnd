/*
  Warnings:

  - You are about to drop the `BehavioralAnalysis` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "BehavioralAnalysis";

-- CreateTable
CREATE TABLE "PulseResponse" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PulseResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClimaResponse" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClimaResponse_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PulseResponse" ADD CONSTRAINT "PulseResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClimaResponse" ADD CONSTRAINT "ClimaResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
