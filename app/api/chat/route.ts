import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CourseExtractionResult } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are Ivy, an AI study assistant. Extract course structure, deadlines, and tasks from the provided conversation context and document text.

Respond ONLY with JSON that matches the provided schema exactly. Populate every field you can from the source material, leave arrays empty when no data is available, and set a field to null rather than inventing details when the document does not state them. Estimate reasonable priorities for deadlines/tasks (low, medium, high) when not stated.`;

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

export async function POST(req: NextRequest) {
  try {
    const { messages, fileContent } = await req.json();

    console.log('Received request:', { messagesCount: messages?.length, hasFileContent: !!fileContent });

    // Prepare messages for OpenAI
    const openaiMessages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Add conversation history
    messages.forEach((msg: any) => {
      openaiMessages.push({
        role: msg.role,
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

    console.log('Calling OpenAI API with', openaiMessages.length, 'messages');

    // Call OpenAI API with JSON schema response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      temperature: 0.2,
      max_tokens: 4000,
      response_format: {
        type: 'json_schema',
        json_schema: COURSE_EXTRACTION_SCHEMA,
      },
    });

    console.log('OpenAI API response received');

    const rawContent = completion.choices[0].message.content;
    let structuredData: CourseExtractionResult | null = null;

    if (rawContent) {
      try {
        structuredData = JSON.parse(rawContent) as CourseExtractionResult;
      } catch (parseError) {
        console.error('Failed to parse JSON response from OpenAI', parseError);
      }
    }

    const assistantMessage = formatAssistantMessage(structuredData);

    return NextResponse.json({
      message: assistantMessage,
      structuredData,
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
