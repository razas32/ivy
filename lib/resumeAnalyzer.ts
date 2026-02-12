import { detectSeniorityCues, extractKeywords } from '@/lib/textUtils';

export interface ResumeAnalysisResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  seniorityCues: string[];
}

export function runResumeKeywordAnalysis(resumeText: string, jobDescription: string): ResumeAnalysisResult {
  const jdKeywords = Array.from(new Set(extractKeywords(jobDescription, 160)));
  const resumeKeywords = new Set(extractKeywords(resumeText, 220));

  const matchedKeywords = jdKeywords.filter((keyword) => resumeKeywords.has(keyword));
  const missingKeywords = jdKeywords.filter((keyword) => !resumeKeywords.has(keyword));

  const uniqueJdCount = jdKeywords.length || 1;
  const matchScore = Math.round((matchedKeywords.length / uniqueJdCount) * 100);

  return {
    matchScore,
    matchedKeywords: matchedKeywords.slice(0, 40),
    missingKeywords: missingKeywords.slice(0, 5),
    seniorityCues: detectSeniorityCues(jobDescription),
  };
}
