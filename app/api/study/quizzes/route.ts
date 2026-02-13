import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/server/auth';
import { QuizQuestion } from '@/types';
import { supabaseRest } from '@/lib/server/supabaseRest';

interface Payload {
  questions: QuizQuestion[];
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = await requireAuthenticatedUser(req);
  if (errorResponse || !user) return errorResponse!;

  try {
    const body = (await req.json()) as Payload;
    const questions = Array.isArray(body.questions) ? body.questions : [];

    const setRows = await supabaseRest<{ id: string }[]>(
      'study_sets?select=id',
      {
        method: 'POST',
        body: [{ user_id: user.id, kind: 'quiz', title: `Quiz ${new Date().toISOString()}` }],
        prefer: 'return=representation',
      }
    );

    const studySetId = setRows[0]?.id;
    if (!studySetId) {
      throw new Error('Failed to create quiz set.');
    }

    if (questions.length > 0) {
      await supabaseRest(
        'quiz_questions',
        {
          method: 'POST',
          body: questions.map((question, index) => ({
            id: question.id || crypto.randomUUID(),
            study_set_id: studySetId,
            type: question.type,
            prompt: question.prompt,
            options: question.options || [],
            answer: question.answer,
            position: index,
          })),
          prefer: 'return=minimal',
        }
      );
    }

    return NextResponse.json({ ok: true, studySetId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save quiz questions.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
