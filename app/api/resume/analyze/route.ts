import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimiter';
import { extractTextFromUpload } from '@/lib/fileTextExtraction';
import { runResumeKeywordAnalysis } from '@/lib/resumeAnalyzer';
import { stripHtml } from '@/lib/textUtils';
import { requireAuthenticatedUser } from '@/lib/server/auth';
import { createOpenAIClientForRequest, getOpenAIKeySource, hasAnyOpenAIKey } from '@/lib/server/openai';

function getClientKey(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return ip || 'anon';
}

async function getRecommendations(
  req: NextRequest,
  jobDescription: string,
  resumeText: string,
  missingKeywords: string[]
) {
  const openai = createOpenAIClientForRequest(req);
  if (!openai) {
    return [
      'Add a summary line aligned to the role scope and top requirements.',
      `Include evidence for missing keywords: ${missingKeywords.slice(0, 3).join(', ') || 'role-specific tools'}.`,
      'Quantify impact in recent bullets using percentages, dollars, or time saved.',
      'Move high-signal technical skills and achievements into the first half of page one.',
      'Rewrite bullets with action verbs and outcome-first phrasing.',
    ];
  }

  const prompt = [
    'You are a resume coach. Return exactly 5 edits as plain text lines (no numbering).',
    'Each line must be actionable and specific to the job description and resume text.',
    '',
    'Job description:',
    jobDescription.slice(0, 7000),
    '',
    'Resume text:',
    resumeText.slice(0, 7000),
  ].join('\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    max_tokens: 350,
    messages: [
      { role: 'system', content: 'You are precise and concise.' },
      { role: 'user', content: prompt },
    ],
  });

  const text = completion.choices[0]?.message?.content || '';
  const items = text
    .split('\n')
    .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 5);

  return items.length ? items : ['Add quantified outcomes to each core experience bullet.'];
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuthenticatedUser(req);
  if (errorResponse) return errorResponse;

  const startedAt = Date.now();
  const rateKey = `resume:${getClientKey(req)}`;
  const rate = checkRateLimit(rateKey, 5, 60_000);

  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${rate.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const rawJd = String(formData.get('jobDescription') || '');
    const jobDescription = stripHtml(rawJd);

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Resume PDF file is required.' }, { status: 400 });
    }

    if (!jobDescription.trim()) {
      return NextResponse.json({ error: 'Job description is required.' }, { status: 400 });
    }

    const resumeText = await extractTextFromUpload(file);

    if (!resumeText) {
      return NextResponse.json({ error: 'Could not extract text from the uploaded resume.' }, { status: 400 });
    }

    const analysis = runResumeKeywordAnalysis(resumeText, jobDescription);
    const recommendations = await getRecommendations(req, jobDescription, resumeText, analysis.missingKeywords);

    const elapsedMs = Date.now() - startedAt;
    console.info('resume_analyze_complete', {
      elapsedMs,
      resumeChars: resumeText.length,
      jdChars: jobDescription.length,
      matchedKeywords: analysis.matchedKeywords.length,
      score: analysis.matchScore,
    });

    return NextResponse.json({
      matchScore: analysis.matchScore,
      matchedKeywords: analysis.matchedKeywords,
      missingKeywords: analysis.missingKeywords,
      seniorityCues: analysis.seniorityCues,
      recommendations,
      extractedResumePreview: resumeText.slice(0, 1000),
      telemetry: {
        elapsedMs,
        model: hasAnyOpenAIKey(req) ? 'gpt-4o-mini' : 'fallback',
        keySource: getOpenAIKeySource(req),
      },
    });
  } catch (error) {
    console.error('resume_analyze_error', error);
    const message = error instanceof Error ? error.message : 'Failed to analyze resume.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
