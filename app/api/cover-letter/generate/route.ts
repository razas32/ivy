import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimiter';
import { stripHtml } from '@/lib/textUtils';
import { requireAuthenticatedUser } from '@/lib/server/auth';
import { createOpenAIClientForRequest } from '@/lib/server/openai';

interface Payload {
  jobDescription: string;
  resumeSummary: string;
  tone?: string;
}

function getClientKey(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return ip || 'anon';
}

function containsProfanity(text: string) {
  const banned = ['fuck', 'shit', 'bitch', 'asshole'];
  const lower = text.toLowerCase();
  return banned.some((word) => lower.includes(word));
}

function fallbackDraft(jobDescription: string, resumeSummary: string) {
  const jdKeywords = jobDescription
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 4)
    .slice(0, 8);

  const lines = [
    'Dear Hiring Manager,',
    '',
    'I am excited to apply for this role. My background aligns with the responsibilities in your posting, including ownership of outcomes, cross-functional collaboration, and high-quality delivery.',
    '',
    `From my experience: ${resumeSummary.slice(0, 220)}${resumeSummary.length > 220 ? '...' : ''}`,
    '',
    `I am especially aligned with your focus on ${jdKeywords.slice(0, 3).join(', ') || 'impactful execution'}.`,
    '',
    'Thank you for your time and consideration. I would welcome the opportunity to discuss how I can contribute.',
    '',
    'Sincerely,',
    '[Your Name]',
  ];

  return {
    draft: lines.join('\n'),
    outline: [
      'Opening interest in role',
      'Relevant background and outcomes',
      'Alignment with priorities',
      'Close and call to action',
    ],
    keywordsUsed: jdKeywords,
  };
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuthenticatedUser(req);
  if (errorResponse) return errorResponse;

  const rateKey = `cover-letter:${getClientKey(req)}`;
  const rate = checkRateLimit(rateKey, 5, 60_000);

  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${rate.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  try {
    const body = (await req.json()) as Payload;
    const jobDescription = stripHtml(body.jobDescription || '').slice(0, 14000);
    const resumeSummary = stripHtml(body.resumeSummary || '').slice(0, 7000);
    const tone = stripHtml(body.tone || 'confident and concise').slice(0, 120);

    if (!jobDescription) {
      return NextResponse.json({ error: 'Job description is required.' }, { status: 400 });
    }

    if (!resumeSummary) {
      return NextResponse.json({ error: 'Resume summary is required.' }, { status: 400 });
    }

    if (containsProfanity(jobDescription) || containsProfanity(resumeSummary)) {
      return NextResponse.json({ error: 'Please remove profanity from your inputs.' }, { status: 400 });
    }

    const openai = createOpenAIClientForRequest(req);
    if (!openai) {
      return NextResponse.json(fallbackDraft(jobDescription, resumeSummary));
    }

    const systemPrompt = 'You write ATS-friendly cover letters. Keep it plain text, 300-400 words, and specific.';
    const userPrompt = [
      'Return strict JSON with keys: draft (string), outline (string[]), keywords_used (string[]).',
      `Tone: ${tone}`,
      '',
      'Job description:',
      jobDescription,
      '',
      'Resume summary:',
      resumeSummary,
    ].join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.35,
      max_tokens: 900,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    let parsed: any;

    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(fallbackDraft(jobDescription, resumeSummary));
    }

    return NextResponse.json({
      draft: String(parsed?.draft || ''),
      outline: Array.isArray(parsed?.outline) ? parsed.outline.map(String).slice(0, 8) : [],
      keywordsUsed: Array.isArray(parsed?.keywords_used) ? parsed.keywords_used.map(String).slice(0, 20) : [],
    });
  } catch (error) {
    console.error('cover_letter_generate_error', error);
    const message = error instanceof Error ? error.message : 'Failed to generate cover letter.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
