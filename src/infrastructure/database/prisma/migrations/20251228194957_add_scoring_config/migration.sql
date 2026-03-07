-- CreateEnum
CREATE TYPE "ScoringAlgorithm" AS ENUM ('EXPONENTIAL_DECAY', 'LINEAR', 'FIXED');

-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "scoringAlgorithm" "ScoringAlgorithm" NOT NULL DEFAULT 'EXPONENTIAL_DECAY',
ADD COLUMN     "scoringDecayRate" DOUBLE PRECISION NOT NULL DEFAULT 2.0;
