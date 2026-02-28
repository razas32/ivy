import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CourseExtractionResult, Flashcard, QuizQuestion } from '@/types';
import { requireAuthenticatedUser } from '@/lib/server/auth';
import { createOpenAIClientForRequest } from '@/lib/server/openai';

const SYSTEM_PROMPT = `You are Ivy, an AI study assistant. Extract course structure, deadlines, and tasks from the provided conversation context and document text.

Respond ONLY with JSON that matches the provided schema exactly. Populate every field you can from the source material, leave arrays empty when no data is available, and set a field to null rather than inventing details when the document does not state them. Estimate reasonable priorities for deadlines/tasks (low, medium, high) when not stated.`;

const GENERAL_PROMPT = `You are Ivy, an AI study assistant.

Write clean, concise markdown that is easy to scan on mobile and desktop.

Style rules:
- Prefer short sections with clear headings (## or ###).
- Use flat bullet lists for steps/checklists.
- Use bold only for key terms.
- Use fenced code blocks only when needed.
- Keep responses compact and avoid filler.
- Do not include citations unless asked.
- End with one practical next step when action is useful.`;

const COURSE_EXTRACTION_SCHEMA = {
  name: 'course_extraction',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['courses', 'summary', 'immediateActions'],
    properties: {
      courses: {
        type: 'array',
        description: 'Information about each course found in the source',
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'courseCode',
            'courseName',
            'term',
            'program',
            'description',
            'meetingInfo',
            'instructors',
            'notes',
            'deadlines',
            'tasks'
          ],
          properties: {
            courseCode: { type: 'string', description: 'Official course code such as CS101' },
            courseName: { type: 'string', description: 'Name/title of the course' },
            term: { type: 'string', description: 'Academic term or session', nullable: true },
            program: { type: 'string', description: 'Program, department, or certificate the course belongs to', nullable: true },
            description: { type: 'string', description: 'Short description or summary of the course', nullable: true },
            meetingInfo: {
              type: 'array',
              description: 'Schedule information, classroom locations, or delivery modality notes',
              items: { type: 'string' },
              default: [],
            },
            instructors: {
              type: 'array',
              description: 'Instructor and TA details',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['name', 'email', 'office', 'officeHours'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', nullable: true },
                  office: { type: 'string', nullable: true },
                  officeHours: { type: 'string', nullable: true },
                },
              },
              default: [],
            },
            notes: {
              type: 'array',
              description: 'Important miscellaneous notes or policies',
              items: { type: 'string' },
              default: [],
            },
            deadlines: {
              type: 'array',
              description: 'Major assessments or milestones with due dates',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['title', 'dueDate', 'priority', 'description'],
                properties: {
                  title: { type: 'string' },
                  dueDate: { type: 'string', description: 'Keep as written in the source; include year if available' },
                  description: { type: 'string', nullable: true },
                  priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                },
              },
              default: [],
            },
            tasks: {
              type: 'array',
              description: 'Actionable steps for the student to complete',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['title', 'priority', 'description', 'dueDate', 'category'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  dueDate: { type: 'string', nullable: true },
                  priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                  category: { type: 'string', nullable: true },
                },
              },
              default: [],
            },
          },
        },
        default: [],
      },
      summary: {
        type: 'string',
        description: 'High-level summary of the document',
        nullable: true,
      },
      immediateActions: {
        type: 'array',
        description: 'Top follow-up actions the student should take right now',
        items: { type: 'string' },
        default: [],
      },
    },
  },
  strict: true,
} as const;

const FLASHCARD_PROMPT = `You are Ivy, an AI study assistant. Given lecture or study material, extract concise flashcards.

- Front: short prompt/question.
- Back: concise answer with key details.
- Avoid markdown, bullets, and citations. Keep each side under 240 characters.`;

const FLASHCARD_SCHEMA = {
  name: 'flashcard_generation',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['flashcards'],
    properties: {
      flashcards: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['front', 'back'],
          properties: {
            front: { type: 'string' },
            back: { type: 'string' },
          },
        },
        default: [],
      },
    },
  },
  strict: true,
} as const;

const QUIZ_PROMPT = `You are Ivy, an AI study assistant. Generate a short quiz that helps a student self-test.

- Include a mix of multiple-choice and true/false or fill-in questions.
- Keep answers concise; for multiple choice, supply options and the correct answer text.
- Avoid markdown and citations.`;

const QUIZ_SCHEMA = {
  name: 'quiz_generation',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['questions'],
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'prompt', 'type', 'options', 'answer'],
          properties: {
            id: { type: 'string' },
            prompt: { type: 'string' },
            type: { type: 'string', enum: ['mcq', 'truefalse', 'fill'] },
            options: {
              type: 'array',
              items: { type: 'string' },
              default: [],
            },
            answer: { type: 'string' },
          },
        },
        default: [],
      },
    },
  },
  strict: true,
} as const;

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuthenticatedUser(req);
  if (errorResponse) return errorResponse;

  try {
    const openai = createOpenAIClientForRequest(req);
    if (!openai) {
      return NextResponse.json(
        { error: 'No OpenAI API key is configured. Add your own key in settings or set OPENAI_API_KEY on the server.' },
        { status: 400 }
      );
    }

    const { messages, fileContent, generationType } = await req.json();
    const mode: 'chat' | 'course' | 'flashcards' | 'quiz' =
      generationType === 'course' || generationType === 'flashcards' || generationType === 'quiz'
        ? generationType
        : 'chat';
    const safeMessages = Array.isArray(messages) ? messages : [];

    console.log('Received request:', { messagesCount: safeMessages.length, hasFileContent: !!fileContent, mode });

    // Prepare messages for OpenAI
    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: getSystemPrompt(mode) },
    ];

    // Add conversation history
    safeMessages.forEach((msg: any) => {
      openaiMessages.push({
        role: msg?.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content || '',
      });
    });

    // If there's file content, add it to the latest user message
    if (fileContent) {
      const lastUserMessage = openaiMessages[openaiMessages.length - 1];
      if (lastUserMessage.role === 'user') {
        // Truncate file content if it's too large (roughly 50k characters = ~12.5k tokens)
        const maxFileLength = 50000;
        const truncatedContent = fileContent.length > maxFileLength
          ? fileContent.substring(0, maxFileLength) + '\n\n[Document truncated due to length...]'
          : fileContent;

        lastUserMessage.content += `\n\nDocument content:\n${truncatedContent}`;
      }
    }

    console.log('Calling OpenAI API with', openaiMessages.length, 'messages for mode', mode);

    const responseFormat = getResponseFormat(mode);
    if (mode === 'chat') {
      return streamChatCompletion(openai, openaiMessages);
    }

    // Call OpenAI API with JSON schema response when needed
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      temperature: 0.2,
      max_tokens: 4000,
      ...(responseFormat ? { response_format: responseFormat } : {}),
    });

    console.log('OpenAI API response received');

    const rawContent = completion.choices[0].message.content;
    let structuredData: CourseExtractionResult | null = null;
    let flashcards: Flashcard[] | undefined;
    let quizQuestions: QuizQuestion[] | undefined;

    if (rawContent && responseFormat) {
      try {
        const parsed = JSON.parse(rawContent);
        if (mode === 'flashcards') {
          flashcards = normalizeFlashcards(parsed?.flashcards || []);
        } else if (mode === 'quiz') {
          quizQuestions = normalizeQuizQuestions(parsed?.questions || []);
        } else if (mode === 'course') {
          structuredData = parsed as CourseExtractionResult;
        } else {
          // chat mode returns plain text; no parsing
        }
      } catch (parseError) {
        console.error('Failed to parse JSON response from OpenAI', parseError);
      }
    }

    const assistantMessage =
      mode === 'flashcards'
        ? formatFlashcardMessage(flashcards)
        : mode === 'quiz'
        ? formatQuizMessage(quizQuestions)
        : mode === 'course'
        ? formatAssistantMessage(structuredData)
        : normalizeChatMarkdown(rawContent || '');

    return NextResponse.json({
      message: assistantMessage,
      structuredData,
      flashcards,
      quizQuestions,
    });
  } catch (error: any) {
    console.error('OpenAI API error details:', {
      message: error.message,
      status: error.status,
      type: error.type,
      code: error.code,
      fullError: error
    });
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

function streamChatCompletion(
  openai: OpenAI,
  openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let accumulated = '';
      try {
        const completionStream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: openaiMessages,
          temperature: 0.2,
          max_tokens: 4000,
          stream: true,
        });

        for await (const chunk of completionStream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (!delta) continue;
          accumulated += delta;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'delta', content: delta })}\n\n`)
          );
        }

        const normalized = normalizeChatMarkdown(accumulated);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done', message: normalized })}\n\n`)
        );
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to stream response from AI.';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

function normalizeChatMarkdown(raw: string) {
  const fallback = 'How else can I help?';
  if (!raw || typeof raw !== 'string') return fallback;

  let content = raw.replace(/\r\n/g, '\n').trim();
  if (!content) return fallback;

  const fencedMarkdownMatch = content.match(/^```(?:markdown|md)?\n([\s\S]*?)\n```$/i);
  if (fencedMarkdownMatch) {
    content = fencedMarkdownMatch[1].trim();
  }

  content = content
    .replace(/^(sure|absolutely|of course|certainly)[!.]?\s*\n+/i, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/([^\n])\n(#{1,3}\s)/g, '$1\n\n$2')
    .replace(/([^\n])\n([-*]\s)/g, '$1\n\n$2')
    .replace(/([^\n])\n(\d+\.\s)/g, '$1\n\n$2')
    .trim();

  const dedupedLines: string[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    const prev = dedupedLines[dedupedLines.length - 1]?.trim();
    if (trimmed && prev && trimmed.toLowerCase() === prev.toLowerCase()) {
      continue;
    }
    dedupedLines.push(line);
  }

  content = dedupedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

  return content || fallback;
}

function formatAssistantMessage(data: CourseExtractionResult | null) {
  if (!data || !data.courses || data.courses.length === 0) {
    return 'I reviewed the material but could not identify clear course details. Could you share more specifics or a clearer syllabus?';
  }

  const courseSummaries = data.courses.map(course => {
    const header = `### ${course.courseCode} – ${course.courseName}`;
    const termLine = course.term ? `- **Term**: ${course.term}` : '';
    const description = course.description ? `- **Overview**: ${course.description}` : '';
    const meetingInfo = course.meetingInfo && course.meetingInfo.length
      ? `- **Schedule**:\n${course.meetingInfo.map(item => `  - ${item}`).join('\n')}`
      : '';
    const instructors = course.instructors && course.instructors.length
      ? `- **Teaching Team**:\n${course.instructors.map(instr => {
          const contactBits = [instr.email, instr.office, instr.officeHours].filter(Boolean).join(' • ');
          return `  - ${instr.name}${contactBits ? ` (${contactBits})` : ''}`;
        }).join('\n')}`
      : '';

    const deadlineSection = course.deadlines.length
      ? `- **Deadlines**:\n${course.deadlines.map(deadline => {
          const due = deadline.dueDate || 'TBD';
          const detail = deadline.description ? `: ${deadline.description}` : '';
          return `  - ${deadline.title} (${due}) — ${deadline.priority.toUpperCase()} priority${detail}`;
        }).join('\n')}`
      : '- **Deadlines**: None listed';

    const taskSection = course.tasks.length
      ? `- **Tasks**:\n${course.tasks.map(task => {
          const details = [
            task.priority ? `${task.priority.toUpperCase()} priority` : '',
            task.dueDate ? `due ${task.dueDate}` : '',
            task.description ?? '',
          ].filter(Boolean).join('; ');
          return `  - ${task.title}${details ? ` — ${details}` : ''}`;
        }).join('\n')}`
      : '- **Tasks**: None identified';

    const notes = course.notes && course.notes.length
      ? `- **Notes**:\n${course.notes.map(note => `  - ${note}`).join('\n')}`
      : '';

    return [header, termLine, description, meetingInfo, instructors, deadlineSection, taskSection, notes]
      .filter(Boolean)
      .join('\n');
  }).join('\n\n');

  const summaryPart = data.summary ? `\n\n**Summary:** ${data.summary}` : '';
  const actionsPart = data.immediateActions && data.immediateActions.length
    ? `\n\n**Immediate Next Steps:**\n${data.immediateActions.map(action => `- ${action}`).join('\n')}`
    : '';

  return `Here’s what I found:\n\n${courseSummaries}${summaryPart}${actionsPart}`;
}

function getSystemPrompt(mode: 'chat' | 'course' | 'flashcards' | 'quiz') {
  if (mode === 'flashcards') return FLASHCARD_PROMPT;
  if (mode === 'quiz') return QUIZ_PROMPT;
  if (mode === 'course') return SYSTEM_PROMPT;
  return GENERAL_PROMPT;
}

function getResponseFormat(mode: 'chat' | 'course' | 'flashcards' | 'quiz'): OpenAI.Chat.Completions.ChatCompletionCreateParams['response_format'] {
  if (mode === 'flashcards') {
    return { type: 'json_schema', json_schema: FLASHCARD_SCHEMA } as const;
  }

  if (mode === 'quiz') {
    return { type: 'json_schema', json_schema: QUIZ_SCHEMA } as const;
  }

  if (mode === 'course') {
    return { type: 'json_schema', json_schema: COURSE_EXTRACTION_SCHEMA } as const;
  }

  return undefined;
}

function normalizeFlashcards(raw: any[]): Flashcard[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const cards: Flashcard[] = [];

  raw.forEach((card, index) => {
    if (!card?.front || !card?.back) return;
    const front = String(card.front).trim();
    const back = String(card.back).trim();
    const key = `${front.toLowerCase()}|${back.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    cards.push({
      id: card.id || crypto.randomUUID?.() || `card-${Date.now()}-${index}`,
      front,
      back,
    });
  });

  return cards;
}

function normalizeQuizQuestions(raw: any[]): QuizQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(q => q?.prompt && q?.answer && q?.type)
    .map((q, index) => ({
      id: q.id || crypto.randomUUID?.() || `quiz-${Date.now()}-${index}`,
      prompt: String(q.prompt),
      type: q.type as QuizQuestion['type'],
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      answer: String(q.answer),
    }));
}

function formatFlashcardMessage(flashcards?: Flashcard[]) {
  if (!flashcards || flashcards.length === 0) {
    return 'I could not generate flashcards from that content. Try a clearer section of your notes.';
  }
  return `Generated ${flashcards.length} flashcards. Jump into the Flashcards tab to review them.`;
}

function formatQuizMessage(questions?: QuizQuestion[]) {
  if (!questions || questions.length === 0) {
    return 'I could not generate quiz questions from that content. Try a clearer section of your notes.';
  }
  return `Generated ${questions.length} quiz questions. Open the Quiz tab to practice.`;
}
