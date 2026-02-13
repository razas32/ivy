import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/server/auth';
import { supabaseRest } from '@/lib/server/supabaseRest';

type CourseColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink';

interface CreateCoursePayload {
  id?: string;
  code: string;
  name: string;
  color: CourseColor;
  dueDate: string;
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuthenticatedUser(req);
  if (errorResponse || !user) return errorResponse!;

  try {
    const body = (await req.json()) as CreateCoursePayload;
    const id = body.id || crypto.randomUUID();

    await supabaseRest('courses', {
      method: 'POST',
      body: [{
        id,
        user_id: user.id,
        code: body.code?.trim(),
        name: body.name?.trim(),
        color: body.color,
        due_text: body.dueDate?.trim(),
      }],
      prefer: 'return=minimal',
    });

    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create course.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
