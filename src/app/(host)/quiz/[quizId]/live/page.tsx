import { notFound } from 'next/navigation';
import { getServices } from '@application/services/factories';
import { LiveGameScreen } from '@/components/host/live-game-screen';

export const dynamic = 'force-dynamic';

type LivePageProps = {
  params: Promise<{ quizId: string }>;
};

export default async function LivePage({ params }: LivePageProps) {
  const { quizId } = await params;
  const { quizService } = getServices();

  try {
    const quiz = await quizService.getQuizState(quizId);
    return <LiveGameScreen quizId={quizId} initialData={quiz} />;
  } catch (error) {
    if (error instanceof Error && /not found/i.test(error.message)) {
      notFound();
    }
    throw error;
  }
}
