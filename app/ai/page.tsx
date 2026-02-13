'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import StudyAssistant from '@/components/StudyAssistant';
import {
  Course,
  CourseColor,
  CourseExtractionResult,
  Deadline,
  ExtractedCourse,
  Flashcard,
  QuizQuestion,
  Task,
} from '@/types';
import { mockCourses } from '@/lib/mockData';
import { generateId } from '@/lib/utils';
import {
  createCourse,
  createDeadline,
  createTask,
  fetchBootstrap,
  persistFlashcards,
  persistQuizQuestions,
} from '@/lib/clientApi';

const COURSE_COLORS: CourseColor[] = ['blue', 'purple', 'green', 'orange', 'red', 'pink'];

const getNextCourseColor = (index: number) => COURSE_COLORS[index % COURSE_COLORS.length];

const pickDueDate = (course: ExtractedCourse) => {
  if (!course.deadlines || course.deadlines.length === 0) {
    return 'TBD';
  }

  const parsedDeadlines = course.deadlines
    .map(deadline => {
      if (!deadline.dueDate) {
        return { original: 'TBD', timestamp: null };
      }

      const timestamp = Date.parse(deadline.dueDate);
      return {
        original: deadline.dueDate,
        timestamp: Number.isNaN(timestamp) ? null : timestamp,
      };
    });

  const withValidDate = parsedDeadlines
    .filter(item => item.timestamp !== null)
    .sort((a, b) => a.timestamp! - b.timestamp!);

  if (withValidDate.length > 0) {
    return new Date(withValidDate[0].timestamp!).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const fallback = course.deadlines.find(d => d.dueDate)?.dueDate;
  return fallback || 'TBD';
};

export default function AIWorkspacePage() {
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const data = await fetchBootstrap();
        setCourses(data.courses);
        setFlashcards(data.flashcards);
        setQuizQuestions(data.quizQuestions);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load data.';
        setLoadError(message);
      }
    };

    run();
  }, []);

  const handleAssistantStructuredData = async (data: CourseExtractionResult) => {
    if (!data?.courses || data.courses.length === 0) {
      return { createdCourses: [] };
    }

    const newCourses: Course[] = [];
    const newTasks: Task[] = [];
    const newDeadlines: Deadline[] = [];

    data.courses.forEach((extractedCourse) => {
      const courseId = generateId();
      const color = getNextCourseColor(courses.length + newCourses.length);
      const dueDate = pickDueDate(extractedCourse);

      newCourses.push({
        id: courseId,
        code: extractedCourse.courseCode,
        name: extractedCourse.courseName,
        color,
        progress: 0,
        tasksCompleted: 0,
        totalTasks: extractedCourse.tasks.length,
        dueDate,
      });

      extractedCourse.tasks.forEach(task => {
        newTasks.push({
          id: generateId(),
          courseId,
          title: task.title,
          completed: false,
          createdAt: new Date().toISOString(),
          parentTaskId: null,
          dueDate: task.dueDate || undefined,
          priority: task.priority,
          description: task.description || undefined,
          category: task.category || undefined,
        });
      });

      extractedCourse.deadlines.forEach(deadline => {
        newDeadlines.push({
          id: generateId(),
          courseId,
          title: deadline.title,
          dueDate: deadline.dueDate || 'TBD',
          priority: deadline.priority,
          description: deadline.description || undefined,
        });
      });
    });

    try {
      if (newCourses.length > 0) {
        await Promise.all(newCourses.map((course) => createCourse(course)));
        setCourses(prev => [...prev, ...newCourses]);
      }
      if (newTasks.length > 0) {
        await Promise.all(newTasks.map((task) => createTask(task)));
      }
      if (newDeadlines.length > 0) {
        await Promise.all(newDeadlines.map((deadline) => createDeadline(deadline)));
      }
      setLoadError(null);

      return {
        createdCourses: newCourses.map((course) => ({
          id: course.id,
          code: course.code,
          name: course.name,
        })),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Action failed.';
      setLoadError(message);
      return { createdCourses: [] };
    }
  };

  const handleFlashcardsGenerated = async (cards: Flashcard[]) => {
    setFlashcards(cards);
    try {
      await persistFlashcards(cards);
      setLoadError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Action failed.';
      setLoadError(message);
    }
  };

  const handleQuizGenerated = async (questions: QuizQuestion[]) => {
    setQuizQuestions(questions);
    try {
      await persistQuizQuestions(questions);
      setLoadError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Action failed.';
      setLoadError(message);
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar courses={courses} />

      <main className="ml-64 h-screen overflow-hidden">
        <div className="h-full w-full flex flex-col">

          {loadError && <p className="px-8 py-2 text-sm text-red-600 flex-shrink-0">{loadError}</p>}

          <div className="flex-1 min-h-0">
            <StudyAssistant
              onStructuredData={handleAssistantStructuredData}
              flashcards={flashcards}
              quizQuestions={quizQuestions}
              onFlashcardsGenerated={handleFlashcardsGenerated}
              onQuizGenerated={handleQuizGenerated}
              fullHeight
              immersive
            />
          </div>
        </div>
      </main>
    </div>
  );
}
