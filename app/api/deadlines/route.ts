import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/server/auth';
import { toDueAtIsoOrNull } from '@/lib/server/dataTransform';
import { supabaseRest } from '@/lib/server/supabaseRest';

interface CreateDeadlinePayload {
  id?: string;
  courseId: string;
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  description?: string | null;
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuthenticatedUser(req);
  if (errorResponse || !user) return errorResponse!;

  try {
    const body = (await req.json()) as CreateDeadlinePayload;
    const id = body.id || crypto.randomUUID();
    const dueText = body.dueDate.trim();

    await supabaseRest('deadlines', {
      method: 'POST',
      body: [{
        id,
        user_id: user.id,
        course_id: body.courseId,
        title: body.title.trim(),
        due_text: dueText,
        due_at: toDueAtIsoOrNull(dueText),
        priority: body.priority,
        description: body.description || null,
      }],
      prefer: 'return=minimal',
    });

    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create deadline.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
