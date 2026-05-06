-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "aiRoofPrompt" TEXT,
ADD COLUMN     "isAiRoofPreview" BOOLEAN NOT NULL DEFAULT false;
