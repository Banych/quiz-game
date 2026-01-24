-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "answersLockedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "leaderboard_snapshots" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "questionIndex" INTEGER NOT NULL,
    "playerId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboard_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leaderboard_snapshots_quizId_questionIndex_idx" ON "leaderboard_snapshots"("quizId", "questionIndex");

-- CreateIndex
CREATE INDEX "leaderboard_snapshots_playerId_idx" ON "leaderboard_snapshots"("playerId");

-- AddForeignKey
ALTER TABLE "leaderboard_snapshots" ADD CONSTRAINT "leaderboard_snapshots_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard_snapshots" ADD CONSTRAINT "leaderboard_snapshots_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
