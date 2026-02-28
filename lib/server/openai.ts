import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { OPENAI_KEY_HEADER } from '@/lib/openaiKey';

const SERVER_OPENAI_KEY = process.env.OPENAI_API_KEY?.trim() || '';

function sanitizeApiKey(value: string | null) {
  if (!value) return '';
  return value.trim().replace(/[\r\n]/g, '');
}

export function getRequestOpenAIKey(req: NextRequest) {
  return sanitizeApiKey(req.headers.get(OPENAI_KEY_HEADER));
}

export function getResolvedOpenAIKey(req: NextRequest) {
  const requestKey = getRequestOpenAIKey(req);
  return requestKey || SERVER_OPENAI_KEY;
}

export function getOpenAIKeySource(req: NextRequest) {
  return getRequestOpenAIKey(req) ? 'user' : SERVER_OPENAI_KEY ? 'server' : 'none';
}

export function createOpenAIClientForRequest(req: NextRequest) {
  const apiKey = getResolvedOpenAIKey(req);
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export function hasAnyOpenAIKey(req: NextRequest) {
  return Boolean(getResolvedOpenAIKey(req));
}
