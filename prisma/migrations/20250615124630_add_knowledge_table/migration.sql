-- CreateTable
CREATE TABLE "Knowledge" (
    "id" SERIAL NOT NULL,
    "attachment" BYTEA,
    "url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "createdBy_user" INTEGER NOT NULL,

    CONSTRAINT "Knowledge_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Knowledge" ADD CONSTRAINT "Knowledge_createdBy_user_fkey" FOREIGN KEY ("createdBy_user") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
