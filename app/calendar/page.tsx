'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Course, Deadline, Task } from '@/types';
import { loadFromStorage, STORAGE_KEYS } from '@/lib/storage';
import { mockCourses, mockDeadlines, mockTasks } from '@/lib/mockData';
import { parseFlexibleDate } from '@/lib/deadlineUtils';

type ViewMode = 'month' | 'week';

interface CalendarItem {
  id: string;
  title: string;
  dateRaw: string;
  date: Date | null;
  courseId: string;
  type: 'task' | 'deadline';
}

export default function CalendarPage() {
  const [courses] = useState<Course[]>(() => loadFromStorage(STORAGE_KEYS.courses, mockCourses));
  const [tasks] = useState<Task[]>(() => loadFromStorage(STORAGE_KEYS.tasks, mockTasks));
  const [deadlines] = useState<Deadline[]>(() => loadFromStorage(STORAGE_KEYS.deadlines, mockDeadlines));
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const courseById = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  const items = useMemo<CalendarItem[]>(() => {
    const taskItems = tasks
      .filter((task) => !task.parentTaskId)
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        dateRaw: task.dueDate || 'TBD',
        date: task.dueDate ? parseFlexibleDate(task.dueDate) : null,
        courseId: task.courseId,
        type: 'task' as const,
      }));

    const deadlineItems = deadlines.map((deadline) => ({
      id: `deadline-${deadline.id}`,
      title: deadline.title,
      dateRaw: deadline.dueDate,
      date: parseFlexibleDate(deadline.dueDate),
      courseId: deadline.courseId,
      type: 'deadline' as const,
    }));

    return [...taskItems, ...deadlineItems];
  }, [deadlines, tasks]);

  const validDatedItems = items
    .filter((item) => item.date && !Number.isNaN(item.date.getTime()))
    .sort((a, b) => a.date!.getTime() - b.date!.getTime());

  const tbdItems = items.filter((item) => !item.date || Number.isNaN(item.date.getTime()));

  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);
  if (viewMode === 'week') {
    start.setDate(today.getDate() - today.getDay());
    end.setDate(start.getDate() + 7);
  } else {
    start.setDate(1);
    end.setMonth(start.getMonth() + 1);
  }

  const filtered = validDatedItems.filter((item) => item.date! >= start && item.date! < end);

  const groupLabel = (date: Date) =>
    date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

  const grouped = filtered.reduce<Record<string, CalendarItem[]>>((acc, item) => {
    const key = groupLabel(item.date!);
    acc[key] = [...(acc[key] || []), item];
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar courses={courses} />

      <main className="ml-64 pb-20">
        <div className="max-w-7xl mx-auto p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
              <p className="text-sm text-gray-600">Tasks and deadlines in one timeline.</p>
            </div>

            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 text-sm font-medium ${viewMode === 'month' ? 'bg-primary-50 text-primary-700' : 'bg-white text-gray-700'}`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 text-sm font-medium ${viewMode === 'week' ? 'bg-primary-50 text-primary-700' : 'bg-white text-gray-700'}`}
              >
                Week
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <section className="lg:col-span-3 card p-6 border border-gray-200">
              {Object.keys(grouped).length === 0 ? (
                <p className="text-sm text-gray-600">No dated items in this range.</p>
              ) : (
                <div className="space-y-5">
                  {Object.entries(grouped).map(([label, dayItems]) => (
                    <div key={label} className="space-y-2">
                      <h2 className="text-sm uppercase tracking-wide text-gray-500">{label}</h2>
                      {dayItems.map((item) => {
                        const course = courseById.get(item.courseId);
                        return (
                          <Link
                            key={item.id}
                            href={`/courses/${item.courseId}`}
                            className="block border border-gray-200 rounded-lg p-3 hover:border-gray-300"
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900">{item.title}</p>
                              <span className="text-xs px-2 py-1 rounded-full border border-gray-200 bg-surface-50 text-gray-600">
                                {item.type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{course?.code || 'Unknown course'} · {item.dateRaw}</p>
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <aside className="card p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">TBD Bucket</h2>
              {tbdItems.length === 0 ? (
                <p className="text-sm text-gray-600">No undated items.</p>
              ) : (
                <ul className="space-y-2">
                  {tbdItems.map((item) => {
                    const course = courseById.get(item.courseId);
                    return (
                      <li key={item.id} className="border border-gray-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-600">{course?.code || 'Unknown'} · {item.type}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
