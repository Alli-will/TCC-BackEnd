-- CreateTable
CREATE TABLE "BehavioralAnalysis" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by_user_id" INTEGER NOT NULL,

    CONSTRAINT "BehavioralAnalysis_pkey" PRIMARY KEY ("id")
);
