import { notFound } from 'next/navigation';
import { getServices } from '@application/services/factories';
import { PlayerSessionScreen } from '@/components/player/player-session-screen';

export const dynamic = 'force-dynamic';

type PlayerSessionPageProps = {
  params: Promise<{ quizId: string; playerId: string }>;
};

export default async function PlayerSessionPage({
  params,
}: PlayerSessionPageProps) {
  const { quizId, playerId } = await params;
  const { playerService } = getServices();

  try {
    const playerSession = await playerService.getPlayerSession(
      quizId,
      playerId
    );

    return (
      <PlayerSessionScreen
        quizId={quizId}
        playerId={playerId}
        initialSession={playerSession}
      />
    );
  } catch (error) {
    if (error instanceof Error && /not found/i.test(error.message)) {
      notFound();
    }

    throw error;
  }
}
