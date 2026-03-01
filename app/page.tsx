'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import PomodoroCard from '@/components/PomodoroCard';
import GradientStatsCard from '@/components/GradientStatsCard';
import CourseCard from '@/components/CourseCard';
import CourseModal from '@/components/CourseModal';
import AppNotice from '@/components/AppNotice';
import { Course, Deadline, Task } from '@/types';
import { mockCourses, mockDeadlines, mockTasks } from '@/lib/mockData';
import { generateId } from '@/lib/utils';
import { buildAnalytics } from '@/lib/analytics';
import {
  createCourse,
  deleteCourse,
  fetchBootstrap,
  updateCourse,
} from '@/lib/clientApi';

export default function Dashboard() {
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [deadlines, setDeadlines] = useState<Deadline[]>(mockDeadlines);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const data = await fetchBootstrap();
        setCourses(data.courses);
        setTasks(data.tasks);
        setDeadlines(data.deadlines);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load data.';
        setLoadError(message);
      } finally {
        setIsHydrated(true);
      }
    };

    run();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    setCourses(prevCourses =>
      prevCourses.map(course => {
        const courseTasks = tasks.filter(task => task.courseId === course.id && !task.parentTaskId);

        const completed = courseTasks.filter(task => task.completed).length;
        const total = courseTasks.length;
        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

        if (
          course.tasksCompleted === completed &&
          course.totalTasks === total &&
          course.progress === progress
        ) {
          return course;
        }

        return {
          ...course,
          tasksCompleted: completed,
          totalTasks: total,
          progress,
        };
      })
    );
  }, [tasks, isHydrated]);

  const stats = useMemo(() => ({
    tasksCompleted: tasks.filter(task => !task.parentTaskId && task.completed).length,
    totalTasks: tasks.filter(task => !task.parentTaskId).length,
    upcomingDeadlines: deadlines.length,
    activeCourses: courses.length,
  }), [courses, deadlines, tasks]);

  const analytics = useMemo(() => buildAnalytics(tasks, deadlines), [tasks, deadlines]);

  const downloadCsv = (rows: string[][], filename: string) => {
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // CRUD Operations
  const handleCreateCourse = () => {
    setModalMode('create');
    setSelectedCourse(null);
    setIsModalOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setModalMode('edit');
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteCourse(id);
        setCourses(courses.filter(c => c.id !== id));
        setTasks(tasks.filter(task => task.courseId !== id));
        setDeadlines(deadlines.filter(deadline => deadline.courseId !== id));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Action failed.';
        setLoadError(message);
      }
    }
  };

  const handleSaveCourse = async (courseData: Partial<Course>) => {
    if (modalMode === 'create') {
      const newCourse: Course = {
        id: generateId(),
        code: courseData.code!,
        name: courseData.name!,
        color: courseData.color!,
        progress: 0,
        tasksCompleted: 0,
        totalTasks: 0,
        dueDate: courseData.dueDate!,
      };
      try {
        await createCourse(newCourse);
        setCourses([...courses, newCourse]);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Action failed.';
        setLoadError(message);
      }
    } else {
      try {
        await updateCourse(courseData.id!, {
          code: courseData.code,
          name: courseData.name,
          color: courseData.color,
          dueDate: courseData.dueDate,
        });
        setCourses(courses.map(c =>
          c.id === courseData.id
            ? { ...c, ...courseData } as Course
            : c
        ));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Action failed.';
        setLoadError(message);
      }
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar courses={courses} />

      <main className="ml-64 pb-20">
        <div className="max-w-7xl mx-auto px-8 py-10">
          {/* Header */}
          <div className="mb-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back!</h1>
                <p className="text-gray-600">Your academic control center for the week</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    downloadCsv(
                      [
                        ['id', 'courseId', 'title', 'completed', 'priority', 'dueDate', 'parentTaskId'],
                        ...tasks.map((task) => [
                          task.id,
                          task.courseId,
                          task.title,
                          task.completed ? 'true' : 'false',
                          task.priority || '',
                          task.dueDate || '',
                          task.parentTaskId || '',
                        ]),
                      ],
                      'tasks-export.csv'
                    )
                  }
                  className="px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Export Tasks CSV
                </button>
                <button
                  onClick={() =>
                    downloadCsv(
                      [
                        ['id', 'courseId', 'title', 'dueDate', 'priority', 'description'],
                        ...deadlines.map((deadline) => [
                          deadline.id,
                          deadline.courseId,
                          deadline.title,
                          deadline.dueDate,
                          deadline.priority,
                          deadline.description || '',
                        ]),
                      ],
                      'deadlines-export.csv'
                    )
                  }
                  className="px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Export Deadlines CSV
                </button>
              </div>
            </div>
            {loadError && (
              <AppNotice tone="error" className="mt-3">{loadError}</AppNotice>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Pomodoro Timer Card */}
            <PomodoroCard />

            {/* Tasks Completed */}
            <GradientStatsCard
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label="Tasks Completed"
              value={`${stats.tasksCompleted}/${stats.totalTasks}`}
              gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
              iconBg="bg-white/20"
            />

            {/* Upcoming Deadlines */}
            <GradientStatsCard
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              label="Upcoming Deadlines"
              value={stats.upcomingDeadlines}
              gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
              iconBg="bg-white/20"
            />

            {/* Active Courses */}
            <GradientStatsCard
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
              label="Active Courses"
              value={stats.activeCourses}
              gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
              iconBg="bg-white/20"
            />
          </div>

          <div className="card p-6 border border-gray-200 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Progress Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="p-4 rounded-xl border border-gray-200 bg-surface-50">
                <p className="text-sm text-gray-500">Completed Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.completedTasks}/{analytics.totalTasks}</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-200 bg-surface-50">
                <p className="text-sm text-gray-500">Overdue Deadlines</p>
                <p className="text-2xl font-bold text-red-600">{analytics.overdueDeadlines}</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-200 bg-surface-50">
                <p className="text-sm text-gray-500">Due In 7 Days</p>
                <p className="text-2xl font-bold text-amber-600">{analytics.dueSoonDeadlines}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Weekly Burn-down</p>
              {analytics.burnDown.length === 0 ? (
                <p className="text-sm text-gray-600">Not enough task history yet.</p>
              ) : (
                <div className="space-y-2">
                  {analytics.burnDown.map((bucket) => {
                    const completionRatio = bucket.created > 0 ? Math.round((bucket.completed / bucket.created) * 100) : 0;
                    return (
                      <div key={bucket.label} className="grid grid-cols-[120px,1fr,70px] items-center gap-3">
                        <span className="text-xs text-gray-600">{bucket.label}</span>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-course-green" style={{ width: `${completionRatio}%` }} />
                        </div>
                        <span className="text-xs text-gray-700">{bucket.completed}/{bucket.created}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Courses Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
              <button
                onClick={handleCreateCourse}
                className="btn btn-primary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Course
              </button>
            </div>

            {courses.length === 0 ? (
              <div className="card p-14 text-center border border-dashed border-gray-300 bg-gradient-to-b from-white to-surface-50">
                <div className="mx-auto mb-5 h-16 w-16 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>

                <h3 className="text-2xl font-semibold text-gray-900 mb-2">No courses yet</h3>
                <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                  Start by adding your first course to unlock tasks, deadlines, and progress tracking.
                </p>

                <div className="flex items-center justify-center gap-3">
                  <button onClick={handleCreateCourse} className="btn btn-primary px-5 py-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Your First Course
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    deadlines={deadlines}
                    onEdit={handleEditCourse}
                    onDelete={handleDeleteCourse}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="card p-7 border border-gray-200/80">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">AI Workspace</h2>
                <p className="text-sm text-gray-600 mt-1">Chat with Ivy, generate flashcards and quizzes, and ingest course outlines.</p>
              </div>
              <Link href="/ai" className="btn btn-primary px-4 py-2.5">
                Open AI Workspace
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Course Modal */}
      <CourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCourse}
        course={selectedCourse}
        mode={modalMode}
      />
    </div>
  );
}
