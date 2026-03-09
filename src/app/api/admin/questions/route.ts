import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServices } from '@application/services/factories';
import {
  createServerClient,
  isAdminUser,
} from '@infrastructure/auth/supabase-auth-client';

/**
 * GET /api/admin/questions
 * List all questions across quizzes (admin), optionally filtered by quizId or type
 */
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = await createServerClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminUser(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
