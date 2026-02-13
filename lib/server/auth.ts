import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { supabaseRest } from '@/lib/server/supabaseRest';

export const SESSION_COOKIE = 'ivy_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

interface AppUserRow {
  id: string;
  username: string;
  password_hash: string;
}

interface SessionWithUserRow {
  id: string;
  user_id: string;
  expires_at: string;
  app_users: {
    id: string;
    username: string;
  };
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function hashPassword(password: string, saltHex?: string) {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

function verifyPassword(password: string, stored: string) {
  const [algo, saltHex, hashHex] = stored.split('$');
  if (algo !== 'scrypt' || !saltHex || !hashHex) return false;
  const candidate = scryptSync(password, Buffer.from(saltHex, 'hex'), 64);
  const existing = Buffer.from(hashHex, 'hex');
  if (candidate.length !== existing.length) return false;
  return timingSafeEqual(candidate, existing);
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createUser(username: string, password: string) {
  const normalized = normalizeUsername(username);
  const passwordHash = hashPassword(password);

  const rows = await supabaseRest<AppUserRow[]>(
    'app_users?select=id,username,password_hash',
    {
      method: 'POST',
      body: [{ username: normalized, password_hash: passwordHash }],
      prefer: 'return=representation',
    }
  );

  return rows[0];
}

export async function verifyUserCredentials(username: string, password: string) {
  const normalized = normalizeUsername(username);
  const rows = await supabaseRest<AppUserRow[]>(
    `app_users?select=id,username,password_hash&username=eq.${encodeURIComponent(normalized)}&limit=1`
  );

  const user = rows[0];
  if (!user) return null;

  if (!verifyPassword(password, user.password_hash)) {
    return null;
  }

  return user;
}

export async function createSessionForUser(userId: string) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  await supabaseRest(
    'app_sessions',
    {
      method: 'POST',
      body: [{ user_id: userId, token_hash: tokenHash, expires_at: expiresAt }],
      prefer: 'return=minimal',
    }
  );

  return { token, expiresAt };
}

export function setSessionCookie(response: NextResponse, token: string, expiresAtIso: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAtIso),
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  });
}

export async function deleteSessionByToken(token: string) {
  if (!token) return;
  const tokenHash = hashToken(token);
  await supabaseRest(`app_sessions?token_hash=eq.${tokenHash}`, {
    method: 'DELETE',
    prefer: 'return=minimal',
  });
}

export async function getAuthenticatedUser(req?: NextRequest) {
  const token = req ? req.cookies.get(SESSION_COOKIE)?.value : (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const rows = await supabaseRest<SessionWithUserRow[]>(
    `app_sessions?select=id,user_id,expires_at,app_users!inner(id,username)&token_hash=eq.${tokenHash}&limit=1`
  );

  const session = rows[0];
  if (!session) return null;

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await deleteSessionByToken(token);
    return null;
  }

  return {
    id: session.app_users.id,
    username: session.app_users.username,
  };
}

export async function requireAuthenticatedUser(req?: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return { user: null, errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return { user, errorResponse: null };
}

export function sanitizeCredentials(input: { username?: string; password?: string }) {
  const username = normalizeUsername(input.username || '');
  const password = (input.password || '').trim();

  if (!username) {
    throw new Error('Username is required.');
  }

  if (!password) {
    throw new Error('Password is required.');
  }

  if (username.length < 3 || username.length > 32) {
    throw new Error('Username must be between 3 and 32 characters.');
  }

  if (password.length > 128) {
    throw new Error('Password is too long.');
  }

  return { username, password };
}
