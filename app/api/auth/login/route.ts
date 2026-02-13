import { NextRequest, NextResponse } from 'next/server';
import { createSessionForUser, sanitizeCredentials, setSessionCookie, verifyUserCredentials } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = sanitizeCredentials(body || {});

    const user = await verifyUserCredentials(username, password);
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    const session = await createSessionForUser(user.id);
    const response = NextResponse.json({
      user: { id: user.id, username: user.username },
    });

    setSessionCookie(response, session.token, session.expiresAt);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to login.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
