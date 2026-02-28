import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

function read(path) {
  return readFileSync(resolve(root, path), 'utf8');
}

function assertIncludes(path, expected) {
  const content = read(path);
  if (!content.includes(expected)) {
    throw new Error(`${path} is missing expected text: ${expected}`);
  }
}

function run() {
  assertIncludes('README.md', 'bring-your-own-key');
  assertIncludes('README.md', 'OPENAI_API_KEY');
  assertIncludes('components/OpenAIKeySettings.tsx', 'local storage');
  assertIncludes('lib/server/openai.ts', 'OPENAI_KEY_HEADER');
  assertIncludes('app/api/chat/route.ts', 'createOpenAIClientForRequest');
  assertIncludes('app/api/resume/analyze/route.ts', 'createOpenAIClientForRequest');
  assertIncludes('app/api/cover-letter/generate/route.ts', 'createOpenAIClientForRequest');
  console.log('BYOK verification passed.');
}

run();
