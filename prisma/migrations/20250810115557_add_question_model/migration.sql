-- AlterTable
ALTER TABLE "searches" ALTER COLUMN "perguntas" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "texto" TEXT NOT NULL,
    "opcoes" JSONB NOT NULL,
    "obrigatoria" BOOLEAN NOT NULL DEFAULT true,
    "searchId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "searches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
