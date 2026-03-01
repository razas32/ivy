import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { OPENAI_KEY_HEADER } from '@/lib/openaiKey';
import {
  getOpenAIKeySourceFromKeys,
  resolveOpenAIKey,
  sanitizeApiKey,
} from '@/lib/core/openaiKeyResolver';

const SERVER_OPENAI_KEY = process.env.OPENAI_API_KEY?.trim() || '';

export function getRequestOpenAIKey(req: NextRequest) {
  return sanitizeApiKey(req.headers.get(OPENAI_KEY_HEADER));
}

export function getResolvedOpenAIKey(req: NextRequest) {
  return resolveOpenAIKey(req.headers.get(OPENAI_KEY_HEADER), SERVER_OPENAI_KEY);
}

export function getOpenAIKeySource(req: NextRequest) {
  return getOpenAIKeySourceFromKeys(req.headers.get(OPENAI_KEY_HEADER), SERVER_OPENAI_KEY);
}

export function createOpenAIClientForRequest(req: NextRequest) {
  const apiKey = getResolvedOpenAIKey(req);
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export function hasAnyOpenAIKey(req: NextRequest) {
  return Boolean(getResolvedOpenAIKey(req));
}
