-- CreateTable
CREATE TABLE "keyword_schedules" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "wordCount" INTEGER NOT NULL DEFAULT 1200,
    "tone" TEXT NOT NULL DEFAULT 'professionnel',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "articlesPerDay" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "articleId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keyword_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "keyword_schedules_articleId_key" ON "keyword_schedules"("articleId");

-- AddForeignKey
ALTER TABLE "keyword_schedules" ADD CONSTRAINT "keyword_schedules_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keyword_schedules" ADD CONSTRAINT "keyword_schedules_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
