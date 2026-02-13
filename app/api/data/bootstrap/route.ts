import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/server/auth';
import { supabaseRest } from '@/lib/server/supabaseRest';
import {
  CourseRow,
  DeadlineRow,
  FlashcardRow,
  QuizQuestionRow,
  TaskRow,
  mapCourseRows,
  mapDeadlineRows,
  mapFlashcardRows,
  mapQuizRows,
  mapTaskRows,
} from '@/lib/server/dataTransform';

interface StudySetRow {
  id: string;
}

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireAuthenticatedUser(req);
  if (errorResponse || !user) return errorResponse!;

  const userIdEncoded = encodeURIComponent(user.id);

  const [courseRows, taskRows, deadlineRows, flashcardSetRows, quizSetRows] = await Promise.all([
    supabaseRest<CourseRow[]>(`courses?select=id,code,name,color,due_text&user_id=eq.${userIdEncoded}&order=created_at.asc`),
    supabaseRest<TaskRow[]>(`tasks?select=id,course_id,title,completed,created_at,parent_task_id,due_text,priority,description,category&user_id=eq.${userIdEncoded}&order=created_at.asc`),
    supabaseRest<DeadlineRow[]>(`deadlines?select=id,course_id,title,due_text,priority,description&user_id=eq.${userIdEncoded}&order=created_at.asc`),
    supabaseRest<StudySetRow[]>(`study_sets?select=id&user_id=eq.${userIdEncoded}&kind=eq.flashcards&order=created_at.desc&limit=1`),
    supabaseRest<StudySetRow[]>(`study_sets?select=id&user_id=eq.${userIdEncoded}&kind=eq.quiz&order=created_at.desc&limit=1`),
  ]);

  const flashcardSetId = flashcardSetRows[0]?.id;
  const quizSetId = quizSetRows[0]?.id;

  const [flashcardRows, quizRows] = await Promise.all([
    flashcardSetId
      ? supabaseRest<FlashcardRow[]>(`flashcards?select=id,front,back&study_set_id=eq.${encodeURIComponent(flashcardSetId)}&order=position.asc`)
      : Promise.resolve([]),
    quizSetId
      ? supabaseRest<QuizQuestionRow[]>(`quiz_questions?select=id,type,prompt,options,answer&study_set_id=eq.${encodeURIComponent(quizSetId)}&order=position.asc`)
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    courses: mapCourseRows(courseRows, taskRows),
    tasks: mapTaskRows(taskRows),
    deadlines: mapDeadlineRows(deadlineRows),
    flashcards: mapFlashcardRows(flashcardRows),
    quizQuestions: mapQuizRows(quizRows),
  });
}
