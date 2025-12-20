import { NextResponse, type NextRequest } from 'next/server';
import { getServices } from '@application/services/factories';
import {
  UpdateQuestionDTO,
  QuestionListItemDTO,
  QuestionAdminDTO,
} from '@application/dtos/question-admin.dto';

/**
 * GET /api/admin/quizzes/[quizId]/questions/[questionId]
 * Get full question details (including options and correctAnswers)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ quizId: string; questionId: string }> }
) {
  try {
    const params = await context.params;
    const { questionId } = params;

    const { questionService } = getServices();
    const question = await questionService.getQuestionById(questionId);

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Return full admin DTO with sensitive fields
    const response: QuestionAdminDTO = {
      id: question.id,
      quizId: question.quizId ?? '',
      text: question.text,
      type: question.type,
      options: question.options ?? [],
      correctAnswers: question.correctAnswers,
      points: question.points,
      orderIndex: question.orderIndex ?? 0,
      createdAt: new Date().toISOString(), // TODO: Get from entity
      updatedAt: new Date().toISOString(), // TODO: Get from entity
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(
      '[GET /api/admin/quizzes/[quizId]/questions/[questionId]]',
      message
    );

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/quizzes/[quizId]/questions/[questionId]
 * Update an existing question
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ quizId: string; questionId: string }> }
) {
  try {
    const params = await context.params;
    const { questionId } = params;
    const body = await request.json();

    // Validate and parse request body
    const dto = UpdateQuestionDTO.parse(body);

    const { questionService } = getServices();
    const question = await questionService.updateQuestion(questionId, dto);

    // Return lightweight DTO
    const response: QuestionListItemDTO = {
      id: question.id,
      text: question.text,
      type: question.type,
      points: question.points,
      orderIndex: question.orderIndex ?? 0,
      hasCorrectAnswers: question.correctAnswers.length > 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(
      '[PATCH /api/admin/quizzes/[quizId]/questions/[questionId]]',
      message
    );

    if (/not found/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * DELETE /api/admin/quizzes/[quizId]/questions/[questionId]
 * Delete a question
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ quizId: string; questionId: string }> }
) {
  try {
    const params = await context.params;
    const { questionId } = params;

    const { questionService } = getServices();
    await questionService.deleteQuestion(questionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(
      '[DELETE /api/admin/quizzes/[quizId]/questions/[questionId]]',
      message
    );

    if (/not found/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
