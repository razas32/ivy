import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, clearSessionCookie, deleteSessionByToken } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value || '';
  if (token) {
    await deleteSessionByToken(token);
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
