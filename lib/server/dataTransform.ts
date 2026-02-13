import { Course, Deadline, Flashcard, QuizQuestion, Task } from '@/types';
import { parseFlexibleDate } from '@/lib/deadlineUtils';

export interface CourseRow {
  id: string;
  code: string;
  name: string;
  color: Course['color'];
  due_text: string;
}

export interface TaskRow {
  id: string;
  course_id: string;
  title: string;
  completed: boolean;
  created_at: string;
  parent_task_id: string | null;
  due_text: string | null;
  priority: Task['priority'] | null;
  description: string | null;
  category: string | null;
}

export interface DeadlineRow {
  id: string;
  course_id: string;
  title: string;
  due_text: string;
  priority: Deadline['priority'];
  description: string | null;
}

export interface FlashcardRow {
  id: string;
  front: string;
  back: string;
}

export interface QuizQuestionRow {
  id: string;
  type: QuizQuestion['type'];
  prompt: string;
  options: string[] | null;
  answer: string;
}

export function toDueAtIsoOrNull(input: string | null | undefined) {
  if (!input) return null;
  const parsed = parseFlexibleDate(input);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export function mapCourseRows(rows: CourseRow[], taskRows: TaskRow[]): Course[] {
  return rows.map((courseRow) => {
    const rootTasks = taskRows.filter((t) => t.course_id === courseRow.id && !t.parent_task_id);
    const tasksCompleted = rootTasks.filter((t) => t.completed).length;
    const totalTasks = rootTasks.length;
    const progress = totalTasks === 0 ? 0 : Math.round((tasksCompleted / totalTasks) * 100);

    return {
      id: courseRow.id,
      code: courseRow.code,
      name: courseRow.name,
      color: courseRow.color,
      dueDate: courseRow.due_text,
      tasksCompleted,
      totalTasks,
      progress,
    };
  });
}

export function mapTaskRows(rows: TaskRow[]): Task[] {
  return rows.map((row) => ({
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    completed: row.completed,
    createdAt: row.created_at,
    parentTaskId: row.parent_task_id,
    dueDate: row.due_text,
    priority: row.priority || undefined,
    description: row.description,
    category: row.category,
  }));
}

export function mapDeadlineRows(rows: DeadlineRow[]): Deadline[] {
  return rows.map((row) => ({
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    dueDate: row.due_text,
    priority: row.priority,
    description: row.description,
  }));
}

export function mapFlashcardRows(rows: FlashcardRow[]): Flashcard[] {
  return rows.map((row) => ({
    id: row.id,
    front: row.front,
    back: row.back,
  }));
}

export function mapQuizRows(rows: QuizQuestionRow[]): QuizQuestion[] {
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    prompt: row.prompt,
    options: row.options || [],
    answer: row.answer,
  }));
}
