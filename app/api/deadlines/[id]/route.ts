import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/server/auth';
import { toDueAtIsoOrNull } from '@/lib/server/dataTransform';
import { supabaseRest } from '@/lib/server/supabaseRest';

interface UpdateDeadlinePayload {
  title?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  description?: string | null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, errorResponse } = await requireAuthenticatedUser(req);
  if (errorResponse || !user) return errorResponse!;

  try {
    const { id } = await params;
    const body = (await req.json()) as UpdateDeadlinePayload;
    const dueText = body.dueDate === undefined ? undefined : body.dueDate.trim();

    await supabaseRest(`deadlines?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`, {
      method: 'PATCH',
      body: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(dueText !== undefined ? { due_text: dueText, due_at: toDueAtIsoOrNull(dueText) } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
      },
      prefer: 'return=minimal',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update deadline.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, errorResponse } = await requireAuthenticatedUser(req);
  if (errorResponse || !user) return errorResponse!;

  try {
    const { id } = await params;
    await supabaseRest(`deadlines?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`, {
      method: 'DELETE',
      prefer: 'return=minimal',
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete deadline.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
