import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/server/auth';
import { toDueAtIsoOrNull } from '@/lib/server/dataTransform';
import { supabaseRest } from '@/lib/server/supabaseRest';

interface UpdateTaskPayload {
  title?: string;
  completed?: boolean;
  parentTaskId?: string | null;
  dueDate?: string | null;
  priority?: 'low' | 'medium' | 'high' | null;
  description?: string | null;
  category?: string | null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, errorResponse } = await requireAuthenticatedUser(req);
  if (errorResponse || !user) return errorResponse!;

  try {
    const { id } = await params;
    const body = (await req.json()) as UpdateTaskPayload;
    const dueText = body.dueDate === undefined ? undefined : (body.dueDate?.trim() || null);

    await supabaseRest(`tasks?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`, {
      method: 'PATCH',
      body: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.completed !== undefined ? { completed: body.completed } : {}),
        ...(body.parentTaskId !== undefined ? { parent_task_id: body.parentTaskId } : {}),
        ...(dueText !== undefined ? { due_text: dueText, due_at: toDueAtIsoOrNull(dueText) } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
      },
      prefer: 'return=minimal',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update task.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, errorResponse } = await requireAuthenticatedUser(req);
  if (errorResponse || !user) return errorResponse!;

  try {
    const { id } = await params;
    await supabaseRest(`tasks?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`, {
      method: 'DELETE',
      prefer: 'return=minimal',
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete task.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
