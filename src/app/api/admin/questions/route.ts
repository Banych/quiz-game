import { NextResponse } from 'next/server';
import { getServices } from '@application/services/factories';

/**
 * GET /api/admin/questions
 * List all questions across quizzes (admin), optionally filtered by quizId or type
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId') ?? undefined;
    const type = searchParams.get('type') ?? undefined;

    const { questionService } = getServices();
    const questions = await questionService.listAllQuestions({ quizId, type });

    return NextResponse.json(questions);
  } catch (error) {
    console.error('[API] list all questions error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
