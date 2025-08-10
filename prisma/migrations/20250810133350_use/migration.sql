/*
  Warnings:

  - A unique constraint covering the columns `[userId,pesquisaId]` on the table `ClimaResponse` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,pesquisaId]` on the table `PulseResponse` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ClimaResponse_userId_pesquisaId_key" ON "ClimaResponse"("userId", "pesquisaId");

-- CreateIndex
CREATE UNIQUE INDEX "PulseResponse_userId_pesquisaId_key" ON "PulseResponse"("userId", "pesquisaId");
