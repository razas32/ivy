import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/server/auth';
import { supabaseRest } from '@/lib/server/supabaseRest';

interface Payload {
  id?: string;
  type: 'cover_letter' | 'resume_report';
  title: string;
  content: unknown;
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuthenticatedUser(req);
  if (errorResponse || !user) return errorResponse!;

  try {
    const body = (await req.json()) as Payload;
    const id = body.id || crypto.randomUUID();

    await supabaseRest('career_assets', {
      method: 'POST',
      body: [{
        id,
        user_id: user.id,
        type: body.type,
        title: body.title.trim(),
        content: body.content ?? {},
      }],
      prefer: 'return=minimal',
    });

    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save asset.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
