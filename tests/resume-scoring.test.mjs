import test from 'node:test';
import assert from 'node:assert/strict';
import { runResumeKeywordAnalysis } from '../lib/core/resumeScoring.ts';

test('runResumeKeywordAnalysis calculates matched and missing keywords', () => {
  const jobDescription = `
    Senior frontend engineer needed for React, TypeScript, GraphQL, testing, and accessibility work.
    This senior role partners with product and design.
  `;
  const resumeText = `
    Built React and TypeScript interfaces, improved accessibility, and partnered with product teams.
  `;

  const result = runResumeKeywordAnalysis(resumeText, jobDescription);

  assert.equal(result.seniorityCues.includes('senior'), true);
  assert.equal(result.matchedKeywords.includes('react'), true);
  assert.equal(result.matchedKeywords.includes('typescript'), true);
  assert.equal(result.missingKeywords.includes('graphql'), true);
  assert.equal(result.matchScore > 0, true);
});
