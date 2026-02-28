import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';

export const OPENAI_KEY_HEADER = 'x-ivy-openai-key';

const OPENAI_KEY_FALLBACK = '';

export function getStoredOpenAIKey() {
  return loadFromStorage(STORAGE_KEYS.openaiApiKey, OPENAI_KEY_FALLBACK).trim();
}

export function saveStoredOpenAIKey(value: string) {
  saveToStorage(STORAGE_KEYS.openaiApiKey, value.trim());
}

export function clearStoredOpenAIKey() {
  saveToStorage(STORAGE_KEYS.openaiApiKey, OPENAI_KEY_FALLBACK);
}

export function getOpenAIKeyHeader() {
  const headers = new Headers();
  const apiKey = getStoredOpenAIKey();
  if (!apiKey) return headers;
  headers.set(OPENAI_KEY_HEADER, apiKey);
  return headers;
}

export function getMaskedOpenAIKey(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 'Not configured';
  if (trimmed.length <= 10) return 'Configured';
  return `${trimmed.slice(0, 7)}...${trimmed.slice(-4)}`;
}
