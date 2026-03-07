import { notFound } from 'next/navigation';
import { getServices } from '@application/services/factories';
import { HostQuizDashboard } from '@/components/host/host-quiz-dashboard';

export const dynamic = 'force-dynamic';

type HostQuizPageProps = {
  params: Promise<{ quizId: string }>;
};

export default async function HostQuizPage({ params }: HostQuizPageProps) {
  const { quizId } = await params;
  const { quizService } = getServices();

  try {
    const quiz = await quizService.getQuizState(quizId);
    return <HostQuizDashboard quizId={quizId} initialQuiz={quiz} />;
  } catch (error) {
    if (error instanceof Error && /not found/i.test(error.message)) {
      notFound();
    }

    throw error;
  }
}
