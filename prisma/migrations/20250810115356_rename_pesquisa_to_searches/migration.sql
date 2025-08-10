/*
  Warnings:

  - You are about to drop the `Pesquisa` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Pesquisa";

-- CreateTable
CREATE TABLE "searches" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "perguntas" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "searches_pkey" PRIMARY KEY ("id")
);
