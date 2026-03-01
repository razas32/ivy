import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getOpenAIKeySourceFromKeys,
  resolveOpenAIKey,
  sanitizeApiKey,
} from '../lib/core/openaiKeyResolver.ts';

test('sanitizeApiKey trims whitespace and strips line breaks', () => {
  assert.equal(sanitizeApiKey('  sk-test-123\r\n'), 'sk-test-123');
});

test('resolveOpenAIKey prefers request key over server key', () => {
  assert.equal(resolveOpenAIKey('sk-user', 'sk-server'), 'sk-user');
});

test('resolveOpenAIKey falls back to server key when request key is absent', () => {
  assert.equal(resolveOpenAIKey('', 'sk-server'), 'sk-server');
});

test('getOpenAIKeySourceFromKeys reports key source correctly', () => {
  assert.equal(getOpenAIKeySourceFromKeys('sk-user', 'sk-server'), 'user');
  assert.equal(getOpenAIKeySourceFromKeys('', 'sk-server'), 'server');
  assert.equal(getOpenAIKeySourceFromKeys('', ''), 'none');
});
