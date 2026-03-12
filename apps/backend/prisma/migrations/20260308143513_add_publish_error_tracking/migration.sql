-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "lastPublishAt" TIMESTAMP(3),
ADD COLUMN     "publishError" TEXT,
ADD COLUMN     "publishRetryCount" INTEGER NOT NULL DEFAULT 0;
