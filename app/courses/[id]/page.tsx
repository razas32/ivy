'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Course, Deadline, Task } from '@/types';
import { mockCourses, mockDeadlines, mockTasks } from '@/lib/mockData';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';
import { generateId } from '@/lib/utils';

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [allTasks, setAllTasks] = useState<Task[]>(mockTasks);
  const [allDeadlines, setAllDeadlines] = useState<Deadline[]>(mockDeadlines);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    params.then((p) => {
      setCourseId(p.id);

      const storedCourses = loadFromStorage<Course[]>(STORAGE_KEYS.courses, mockCourses);
      const storedTasks = loadFromStorage<Task[]>(STORAGE_KEYS.tasks, mockTasks);
      const storedDeadlines = loadFromStorage<Deadline[]>(STORAGE_KEYS.deadlines, mockDeadlines);

      setCourses(storedCourses);
      setAllTasks(storedTasks);
      setAllDeadlines(storedDeadlines);
      setIsHydrated(true);
      setIsLoading(false);
    });
  }, [params]);

  useEffect(() => {
    if (!courseId || !isHydrated) return;

    setCourses((prev) => {
      let changed = false;
      const updated = prev.map((course) => {
        if (course.id !== courseId) return course;

        const courseTasks = allTasks.filter((task) => task.courseId === courseId);
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

  useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(STORAGE_KEYS.courses, courses);
  }, [courses, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(STORAGE_KEYS.tasks, allTasks);
  }, [allTasks, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(STORAGE_KEYS.deadlines, allDeadlines);
  }, [allDeadlines, isHydrated]);

  const course = useMemo(
    () => courses.find((c) => c.id === courseId) || null,
    [courses, courseId]
  );

  const tasks = useMemo(
    () => allTasks.filter((task) => task.courseId === courseId),
    [allTasks, courseId]
  );

  const deadlines = useMemo(
    () => allDeadlines.filter((deadline) => deadline.courseId === courseId),
    [allDeadlines, courseId]
  );

  const getCourseColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-course-blue border-course-blue',
      purple: 'bg-course-purple border-course-purple',
      green: 'bg-course-green border-course-green',
      orange: 'bg-course-orange border-course-orange',
      red: 'bg-course-red border-course-red',
      pink: 'bg-course-pink border-course-pink',
    };
    return colorMap[color] || 'bg-gray-500 border-gray-500';
  };

  const getBgColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-course-blue',
      purple: 'bg-course-purple',
      green: 'bg-course-green',
      orange: 'bg-course-orange',
      red: 'bg-course-red',
      pink: 'bg-course-pink',
    };
    return colorMap[color] || 'bg-gray-500';
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

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !courseId) return;

    const newTask: Task = {
      id: generateId(),
      courseId,
      title: newTaskTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setAllTasks((prev) => [...prev, newTask]);
    setNewTaskTitle('');
  };

  const handleToggleTask = (taskId: string) => {
    setAllTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
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
      <div className="min-h-screen bg-surface-50">
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
      <div className="min-h-screen bg-surface-50">
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

  const completedTasks = tasks.filter((task) => task.completed).length;
  const progressPercentage = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar courses={courses} />
      <main className="ml-64">
        <div className="max-w-7xl mx-auto p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl ${getBgColorClass(course.color)} bg-opacity-10 border-2 ${getCourseColorClass(course.color)} flex items-center justify-center`}>
                <span className={`text-xl font-bold ${getTextColorClass(course.color)}`}>
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
                  <span className="text-sm font-semibold text-gray-700">{completedTasks}/{tasks.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4 border-2 border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Upcoming Deadline</h3>
              <div className="flex items-center gap-2">
                <svg className={`w-5 h-5 ${getTextColorClass(course.color)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-semibold text-gray-900">{course.dueDate}</p>
              </div>
            </div>
            <div className="card p-4 border-2 border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Tasks Completed</h3>
              <p className="text-lg font-semibold text-gray-900">{completedTasks} of {tasks.length}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${getCourseColorClass(course.color).split(' ')[0]}`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            <div className="card p-4 border-2 border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Course Status</h3>
              <p className="text-lg font-semibold text-gray-900">
                {progressPercentage === 100 ? 'On Track' : progressPercentage >= 50 ? 'In Progress' : 'Getting Started'}
              </p>
              <p className="text-sm text-gray-500">Keep up the momentum!</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Deadlines */}
            <div className="lg:col-span-1">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`bg-gradient-to-br ${getGradientClass(course.color)} p-3 rounded-xl text-white`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Upcoming Deadlines</h2>
                  </div>
                </div>

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
            <div className="lg:col-span-2">
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
                    onClick={() => {
                      const title = prompt('Enter task title:');
                      if (title) {
                        setNewTaskTitle(title);
                        setTimeout(() => handleAddTask(), 0);
                      }
                    }}
                    className={`bg-gradient-to-r ${getGradientClass(course.color)} text-white px-4 py-2.5 rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Task
                  </button>
                </div>

                {tasks.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-500 mb-4">No tasks yet</p>
                    <button
                      onClick={() => {
                        const title = prompt('Enter task title:');
                        if (title) {
                          setNewTaskTitle(title);
                          setTimeout(() => handleAddTask(), 0);
                        }
                      }}
                      className={`bg-gradient-to-r ${getGradientClass(course.color)} text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all`}
                    >
                      Add Your First Task
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                          task.completed
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(task.id)}
                          className={`w-6 h-6 rounded-lg border-2 cursor-pointer ${getTextColorClass(course.color)}`}
                          style={{ accentColor: getCourseColorClass(course.color).split(' ')[0].replace('bg-', '#') }}
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
                    ))}
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
