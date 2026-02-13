'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Course, Deadline, Task } from '@/types';
import { mockCourses, mockDeadlines, mockTasks } from '@/lib/mockData';
import { generateId } from '@/lib/utils';
import { formatDeadlineDisplay, getDeadlineStatus, formatAbsoluteDeadlineDate } from '@/lib/deadlineUtils';
import { getCourseStatus, getStatusColorClass, getStatusBgClass } from '@/lib/courseStatusUtils';
import { createDeadline, createTask, fetchBootstrap, updateTask } from '@/lib/clientApi';

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [allTasks, setAllTasks] = useState<Task[]>(mockTasks);
  const [allDeadlines, setAllDeadlines] = useState<Deadline[]>(mockDeadlines);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isAddingDeadline, setIsAddingDeadline] = useState(false);
  const [newDeadline, setNewDeadline] = useState({
    title: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    description: '',
  });
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    description: '',
    category: '',
  });
  const [subtaskDrafts, setSubtaskDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const run = async () => {
      const p = await params;
      setCourseId(p.id);

      try {
        const data = await fetchBootstrap();
        setCourses(data.courses);
        setAllTasks(data.tasks);
        setAllDeadlines(data.deadlines);
      } catch (_error) {
      } finally {
        setIsHydrated(true);
        setIsLoading(false);
      }
    };

    run();
  }, [params]);

  useEffect(() => {
    if (!courseId || !isHydrated) return;

    setCourses((prev) => {
      let changed = false;
      const updated = prev.map((course) => {
        if (course.id !== courseId) return course;

        const courseTasks = allTasks.filter((task) => task.courseId === courseId && !task.parentTaskId);

        const completed = courseTasks.filter((task) => task.completed).length;
        const total = courseTasks.length;
        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

        if (
          course.tasksCompleted === completed &&
          course.totalTasks === total &&
          course.progress === progress
        ) {
          return course;
        }

        changed = true;
        return {
          ...course,
          tasksCompleted: completed,
          totalTasks: total,
          progress,
        };
      });

      return changed ? updated : prev;
    });
  }, [allTasks, courseId, isHydrated]);

  const course = useMemo(
    () => courses.find((c) => c.id === courseId) || null,
    [courses, courseId]
  );

  const tasks = useMemo(
    () => allTasks.filter((task) => task.courseId === courseId),
    [allTasks, courseId]
  );

  const rootTasks = useMemo(
    () => tasks.filter((task) => !task.parentTaskId),
    [tasks]
  );

  const subtasksByParent = useMemo(() => {
    return tasks.reduce<Record<string, Task[]>>((acc, task) => {
      if (!task.parentTaskId) return acc;
      acc[task.parentTaskId] = [...(acc[task.parentTaskId] || []), task];
      return acc;
    }, {});
  }, [tasks]);

  const deadlines = useMemo(
    () => allDeadlines.filter((deadline) => deadline.courseId === courseId),
    [allDeadlines, courseId]
  );

  const getProgressBarColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: '#3b82f6',
      purple: '#a855f7',
      green: '#10b981',
      orange: '#f97316',
      red: '#ef4444',
      pink: '#ec4899',
    };
    return colorMap[color] || '#6b7280';
  };

  const getTextColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'text-course-blue',
      purple: 'text-course-purple',
      green: 'text-course-green',
      orange: 'text-course-orange',
      red: 'text-course-red',
      pink: 'text-course-pink',
    };
    return colorMap[color] || 'text-gray-500';
  };

  const getGradientClass = (color: string) => {
    const gradientMap: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      red: 'from-red-500 to-red-600',
      pink: 'from-pink-500 to-pink-600',
    };
    return gradientMap[color] || 'from-gray-500 to-gray-600';
  };

  const getBadgeGradientClass = (color: string) => {
    const gradientMap: Record<string, string> = {
      blue: 'bg-gradient-to-br from-blue-500 to-blue-700',
      purple: 'bg-gradient-to-br from-purple-500 to-purple-700',
      green: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
      orange: 'bg-gradient-to-br from-orange-500 to-orange-700',
      red: 'bg-gradient-to-br from-red-500 to-red-700',
      pink: 'bg-gradient-to-br from-pink-500 to-pink-700',
    };
    return gradientMap[color] || 'bg-gradient-to-br from-gray-500 to-gray-700';
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !courseId) return;

    const task: Task = {
      id: generateId(),
      courseId,
      title: newTask.title.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      parentTaskId: null,
      dueDate: newTask.dueDate.trim() || null,
      priority: newTask.priority,
      description: newTask.description.trim() || null,
      category: newTask.category.trim() || null,
    };

    try {
      await createTask(task);
      setAllTasks((prev) => [...prev, task]);
      setNewTask({
        title: '',
        dueDate: '',
        priority: 'medium',
        description: '',
        category: '',
      });
      setIsAddingTask(false);
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Action failed.');
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const existing = allTasks.find((task) => task.id === taskId);
    if (!existing) return;
    const nextCompleted = !existing.completed;
    try {
      await updateTask(taskId, { completed: nextCompleted });
      setAllTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed: nextCompleted } : task
        )
      );
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Action failed.');
    }
  };

  const handleAddSubtask = async (parentTaskId: string) => {
    const title = (subtaskDrafts[parentTaskId] || '').trim();
    if (!title || !courseId) return;

    const subtask: Task = {
      id: generateId(),
      courseId,
      parentTaskId,
      title,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: null,
      priority: 'medium',
      description: null,
      category: 'Subtask',
    };

    try {
      await createTask(subtask);
      setAllTasks((prev) => [...prev, subtask]);
      setSubtaskDrafts((prev) => ({ ...prev, [parentTaskId]: '' }));
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Action failed.');
    }
  };

  const handleAddDeadline = async () => {
    if (!newDeadline.title.trim() || !newDeadline.dueDate.trim() || !courseId) return;

    const deadline: Deadline = {
      id: generateId(),
      courseId,
      title: newDeadline.title.trim(),
      dueDate: newDeadline.dueDate.trim(),
      priority: newDeadline.priority,
      description: newDeadline.description.trim() || null,
    };

    try {
      await createDeadline(deadline);
      setAllDeadlines((prev) => [...prev, deadline]);
      setNewDeadline({
        title: '',
        dueDate: '',
        priority: 'medium',
        description: '',
      });
      setIsAddingDeadline(false);
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Action failed.');
    }
  };

  const getPriorityColor = (priority: string) => {
    const colorMap: Record<string, string> = {
      low: 'bg-blue-50 text-blue-700 border-blue-200',
      medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      high: 'bg-red-50 text-red-700 border-red-200',
    };
    return colorMap[priority] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Sidebar courses={courses} />
        <main className="ml-64">
          <div className="max-w-7xl mx-auto p-8">
            <div className="text-center py-12">
              <p className="text-gray-600">Loading course details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen">
        <Sidebar courses={courses} />
        <main className="ml-64">
          <div className="max-w-7xl mx-auto p-8">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900">Course not found</h1>
              <button
                onClick={() => router.push('/')}
                className="mt-4 btn btn-primary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const completedTasks = rootTasks.filter((task) => task.completed).length;
  const progressPercentage = rootTasks.length > 0 ? Math.round((completedTasks / rootTasks.length) * 100) : 0;

  // Determine upcoming deadline based purely on time (not task completion)
  const { nextDeadline: upcomingDeadline, closestDeadline, isFinished: deadlinesFinished } = getDeadlineStatus(deadlines);
  const isCourseFinished = deadlinesFinished;

  // Get intelligent course status
  const courseStatus = getCourseStatus(progressPercentage, deadlines, rootTasks.length);

  const formattedClosestDeadlineDate = closestDeadline ? formatAbsoluteDeadlineDate(closestDeadline) : null;
  const upcomingDeadlineText = isCourseFinished
    ? 'Finished'
    : formatDeadlineDisplay(upcomingDeadline || closestDeadline);
  const upcomingDeadlineSubtitle = isCourseFinished
    ? closestDeadline
      ? `Last deadline: ${formattedClosestDeadlineDate || closestDeadline.title}`
      : 'Course timeline complete'
    : upcomingDeadline?.title || closestDeadline?.title || 'Add your first deadline';

  return (
    <div className="min-h-screen">
      <Sidebar courses={courses} />
      <main className="ml-64">
        <div className="max-w-7xl mx-auto p-8 space-y-6">
          {/* Header */}
          {actionError && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {actionError}
            </div>
          )}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl ${getBadgeGradientClass(course.color)} flex items-center justify-center shadow-inner`}>
                <span className="text-xl font-bold text-white tracking-wide">
                  {course.code.substring(0, 3)}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{course.name}</h1>
                <p className="text-gray-500">{course.code}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-500">Overall Progress</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(progressPercentage)}%</p>
              </div>
              <div className="relative w-16 h-16">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.5a15.5 15.5 0 1 1 0 31 15.5 15.5 0 0 1 0-31"
                  />
                  <path
                    className={getTextColorClass(course.color)}
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    strokeDasharray={`${progressPercentage}, 100`}
                    d="M18 2.5a15.5 15.5 0 1 1 0 31 15.5 15.5 0 0 1 0-31"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-700">{completedTasks}/{rootTasks.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4 border-2 border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Upcoming Deadline</h3>
              <div className="flex items-start gap-2">
                <svg className={`w-5 h-5 mt-0.5 ${getTextColorClass(course.color)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-900">{upcomingDeadlineText}</p>
                  {upcomingDeadlineSubtitle && (
                    <p className="text-sm text-gray-500 mt-0.5">{upcomingDeadlineSubtitle}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="card p-4 border-2 border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Tasks Completed</h3>
              <p className="text-lg font-semibold text-gray-900">{completedTasks} of {rootTasks.length}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${progressPercentage}%`,
                    backgroundColor: getProgressBarColor(course.color)
                  }}
                />
              </div>
            </div>
            <div className={`card p-4 border-2 ${getStatusBgClass(courseStatus.color)}`}>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Course Status</h3>
              <p className={`text-lg font-semibold ${getStatusColorClass(courseStatus.color)}`}>
                {courseStatus.status}
              </p>
              <p className="text-sm text-gray-600">{courseStatus.message}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Deadlines */}
            <div className="lg:col-span-2">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`bg-gradient-to-br ${getGradientClass(course.color)} p-3 rounded-xl text-white`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Deadlines</h2>
                  </div>
                  <button
                    onClick={() => setIsAddingDeadline(!isAddingDeadline)}
                    className={`bg-gradient-to-r ${getGradientClass(course.color)} text-white p-2 rounded-lg hover:shadow-lg transition-all`}
                    title="Add Deadline"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Add Deadline Form */}
                {isAddingDeadline && (
                  <div className="mb-6 p-4 border-2 border-gray-200 rounded-xl bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-4">New Deadline</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                          type="text"
                          value={newDeadline.title}
                          onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })}
                          placeholder="e.g., Final Exam, Project Due"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                        <input
                          type="text"
                          value={newDeadline.dueDate}
                          onChange={(e) => setNewDeadline({ ...newDeadline, dueDate: e.target.value })}
                          placeholder="e.g., Mon. Nov. 24 @ 9:00am or 2024-11-24"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                        <select
                          value={newDeadline.priority}
                          onChange={(e) => setNewDeadline({ ...newDeadline, priority: e.target.value as 'low' | 'medium' | 'high' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                        <textarea
                          value={newDeadline.description}
                          onChange={(e) => setNewDeadline({ ...newDeadline, description: e.target.value })}
                          placeholder="Additional details about this deadline..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleAddDeadline}
                          disabled={!newDeadline.title.trim() || !newDeadline.dueDate.trim()}
                          className={`flex-1 bg-gradient-to-r ${getGradientClass(course.color)} text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          Add Deadline
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingDeadline(false);
                            setNewDeadline({ title: '', dueDate: '', priority: 'medium', description: '' });
                          }}
                          className="px-4 py-2 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {deadlines.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500">No upcoming deadlines</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deadlines.map((deadline) => (
                      <div key={deadline.id} className={`border-2 ${getPriorityColor(deadline.priority)} rounded-xl p-5 hover:shadow-md transition-all`}>
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 text-lg">{deadline.title}</h3>
                          <span className={`text-xs px-3 py-1 rounded-full border uppercase tracking-wide font-medium ${getPriorityColor(deadline.priority)}`}>
                            {deadline.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">{deadline.dueDate}</span>
                        </div>
                        {deadline.description && (
                          <p className="mt-2 text-sm text-gray-600">{deadline.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tasks */}
            <div className="lg:col-span-3">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`bg-gradient-to-br ${getGradientClass(course.color)} p-3 rounded-xl text-white`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
                  </div>
                  <button
                    onClick={() => setIsAddingTask(!isAddingTask)}
                    className={`bg-gradient-to-r ${getGradientClass(course.color)} text-white p-2 rounded-lg hover:shadow-lg transition-all`}
                    title="Add Task"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Add Task Form */}
                {isAddingTask && (
                  <div className="mb-6 p-4 border-2 border-gray-200 rounded-xl bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-4">New Task</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                          type="text"
                          value={newTask.title}
                          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                          placeholder="e.g., Complete assignment, Study for exam"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (optional)</label>
                        <input
                          type="text"
                          value={newTask.dueDate}
                          onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                          placeholder="e.g., Mon. Nov. 24 @ 9:00am or 2024-11-24"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select
                          value={newTask.priority}
                          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category (optional)</label>
                        <input
                          type="text"
                          value={newTask.category}
                          onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                          placeholder="e.g., Homework, Reading, Lab"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                        <textarea
                          value={newTask.description}
                          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                          placeholder="Additional details about this task..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleAddTask}
                          disabled={!newTask.title.trim()}
                          className={`flex-1 bg-gradient-to-r ${getGradientClass(course.color)} text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          Add Task
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingTask(false);
                            setNewTask({ title: '', dueDate: '', priority: 'medium', description: '', category: '' });
                          }}
                          className="px-4 py-2 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {rootTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-500">No tasks yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rootTasks.map((task) => {
                      const subtasks = subtasksByParent[task.id] || [];
                      return (
                        <div
                          key={task.id}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            task.completed
                              ? 'bg-gray-50 border-gray-200'
                              : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => handleToggleTask(task.id)}
                              className={`w-6 h-6 rounded-lg border-2 cursor-pointer ${getTextColorClass(course.color)}`}
                              style={{ accentColor: getProgressBarColor(course.color) }}
                            />
                            <span className={`flex-1 text-lg ${task.completed ? 'line-through text-gray-400' : 'text-gray-900 font-medium'}`}>
                              {task.title}
                            </span>
                            {task.completed && (
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                                ✓ Done
                              </span>
                            )}
                          </div>

                          <div className="mt-3 ml-10 space-y-2">
                            {subtasks.map((subtask) => (
                              <label key={subtask.id} className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={subtask.completed}
                                  onChange={() => handleToggleTask(subtask.id)}
                                  className="w-4 h-4"
                                />
                                <span className={subtask.completed ? 'line-through text-gray-400' : ''}>{subtask.title}</span>
                              </label>
                            ))}
                            <div className="flex gap-2">
                              <input
                                value={subtaskDrafts[task.id] || ''}
                                onChange={(e) =>
                                  setSubtaskDrafts((prev) => ({ ...prev, [task.id]: e.target.value }))
                                }
                                placeholder="Add subtask"
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <button
                                onClick={() => handleAddSubtask(task.id)}
                                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
