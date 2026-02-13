import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/server/auth';
import { toDueAtIsoOrNull } from '@/lib/server/dataTransform';
import { supabaseRest } from '@/lib/server/supabaseRest';

interface CreateTaskPayload {
  id?: string;
  courseId: string;
  title: string;
  completed: boolean;
  createdAt: string;
  parentTaskId?: string | null;
  dueDate?: string | null;
  priority?: 'low' | 'medium' | 'high';
  description?: string | null;
  category?: string | null;
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuthenticatedUser(req);
  if (errorResponse || !user) return errorResponse!;

  try {
    const body = (await req.json()) as CreateTaskPayload;
    const id = body.id || crypto.randomUUID();
    const dueText = body.dueDate?.trim() || null;

    await supabaseRest('tasks', {
      method: 'POST',
      body: [{
        id,
        user_id: user.id,
        course_id: body.courseId,
        parent_task_id: body.parentTaskId || null,
        title: body.title.trim(),
        completed: Boolean(body.completed),
        created_at: body.createdAt || new Date().toISOString(),
        due_text: dueText,
        due_at: toDueAtIsoOrNull(dueText),
        priority: body.priority || null,
        description: body.description || null,
        category: body.category || null,
      }],
      prefer: 'return=minimal',
    });

    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create task.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
