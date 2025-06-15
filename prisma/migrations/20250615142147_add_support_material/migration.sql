-- CreateTable
CREATE TABLE "SupportMaterial" (
    "id" SERIAL NOT NULL,
    "attachment" BYTEA,
    "url" TEXT,
    "emotion" TEXT,
    "reason_emotion_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMaterial_pkey" PRIMARY KEY ("id")
);
