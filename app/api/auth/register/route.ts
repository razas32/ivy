import { NextRequest, NextResponse } from 'next/server';
import { createSessionForUser, createUser, sanitizeCredentials, setSessionCookie } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = sanitizeCredentials(body || {});

    const user = await createUser(username, password);
    const session = await createSessionForUser(user.id);

    const response = NextResponse.json({
      user: { id: user.id, username: user.username },
    });

    setSessionCookie(response, session.token, session.expiresAt);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to register.';
    const lower = message.toLowerCase();
    const status = lower.includes('duplicate') || lower.includes('23505') ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
