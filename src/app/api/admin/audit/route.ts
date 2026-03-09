import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServices } from '@application/services/factories';
import {
  createServerClient,
  isAdminUser,
} from '@infrastructure/auth/supabase-auth-client';

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
    const limitParam = searchParams.get('limit');
    const parsedLimit =
      limitParam != null ? Number.parseInt(limitParam, 10) : undefined;
    const limit =
      parsedLimit != null &&
      Number.isFinite(parsedLimit) &&
      Number.isInteger(parsedLimit) &&
      parsedLimit > 0
        ? parsedLimit
        : undefined;

    const { auditService } = getServices();
    const logs = await auditService.listAuditLogs({ quizId, limit });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('[API] audit log error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
