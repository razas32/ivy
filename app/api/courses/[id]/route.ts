import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/server/auth';
import { supabaseRest } from '@/lib/server/supabaseRest';

interface UpdateCoursePayload {
  code?: string;
  name?: string;
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink';
  dueDate?: string;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, errorResponse } = await requireAuthenticatedUser(req);
  if (errorResponse || !user) return errorResponse!;

  try {
    const { id } = await params;
    const body = (await req.json()) as UpdateCoursePayload;

    await supabaseRest(`courses?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`, {
      method: 'PATCH',
      body: {
        ...(body.code !== undefined ? { code: body.code.trim() } : {}),
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.color !== undefined ? { color: body.color } : {}),
        ...(body.dueDate !== undefined ? { due_text: body.dueDate.trim() } : {}),
      },
      prefer: 'return=minimal',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update course.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, errorResponse } = await requireAuthenticatedUser(req);
  if (errorResponse || !user) return errorResponse!;

  try {
    const { id } = await params;
    await supabaseRest(`courses?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`, {
      method: 'DELETE',
      prefer: 'return=minimal',
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete course.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
