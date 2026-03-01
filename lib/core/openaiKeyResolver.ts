export function sanitizeApiKey(value: string | null | undefined) {
  if (!value) return '';
  return value.trim().replace(/[\r\n]/g, '');
}

export function resolveOpenAIKey(requestKey: string | null | undefined, serverKey: string | null | undefined) {
  const cleanedRequestKey = sanitizeApiKey(requestKey);
  if (cleanedRequestKey) return cleanedRequestKey;
  return sanitizeApiKey(serverKey);
}

export function getOpenAIKeySourceFromKeys(
  requestKey: string | null | undefined,
  serverKey: string | null | undefined
) {
  return sanitizeApiKey(requestKey) ? 'user' : sanitizeApiKey(serverKey) ? 'server' : 'none';
}
