-- CreateTable
CREATE TABLE "article_generations" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "secondaryKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "siteId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "wordCount" INTEGER NOT NULL DEFAULT 1200,
    "tone" TEXT NOT NULL DEFAULT 'professionnel',
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "failedStep" INTEGER,
    "errorMessage" TEXT,
    "serpData" JSONB,
    "intentAnalysis" JSONB,
    "metadata" JSONB,
    "h2Structure" JSONB,
    "articleMarkdown" TEXT,
    "faqHtml" TEXT,
    "finalHtml" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_generations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "article_generations_articleId_key" ON "article_generations"("articleId");

-- AddForeignKey
ALTER TABLE "article_generations" ADD CONSTRAINT "article_generations_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
