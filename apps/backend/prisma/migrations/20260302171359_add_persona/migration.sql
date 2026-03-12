-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "personaId" TEXT;

-- CreateTable
CREATE TABLE "personas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'conversationnel',
    "writingStyle" TEXT NOT NULL,
    "vocabulary" TEXT NOT NULL DEFAULT '',
    "anecdoteType" TEXT NOT NULL DEFAULT '',
    "formalityLevel" TEXT NOT NULL DEFAULT 'semi-formel',
    "recurringExpressions" TEXT NOT NULL DEFAULT '',
    "additionalInstructions" TEXT NOT NULL DEFAULT '',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
