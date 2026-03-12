-- AlterTable
ALTER TABLE "article_generations" ADD COLUMN     "featuredImageUrl" TEXT;

-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "featuredImageAlt" TEXT,
ADD COLUMN     "featuredImageUrl" TEXT;
