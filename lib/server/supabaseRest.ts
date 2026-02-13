const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables are missing.');
  }
}

export interface SupabaseErrorPayload {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
}

export async function supabaseRest<T>(
  pathWithQuery: string,
  init?: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    prefer?: string;
  }
): Promise<T> {
  assertSupabaseConfig();

  const method = init?.method || 'GET';
  const headers: Record<string, string> = {
    apikey: SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY!}`,
  };

  if (init?.prefer) {
    headers.Prefer = init.prefer;
  }

  let body: string | undefined;
  if (init?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.body);
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${pathWithQuery}`, {
    method,
    headers,
    body,
    cache: 'no-store',
  });

  const raw = await response.text();
  const parsed = raw ? (JSON.parse(raw) as unknown) : null;

  if (!response.ok) {
    const err = (parsed || {}) as SupabaseErrorPayload;
    const parts = [err.message, err.details, err.code].filter(Boolean);
    throw new Error(parts.join(' | ') || `Supabase REST request failed (${response.status})`);
  }

  return parsed as T;
}
