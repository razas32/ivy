'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import PomodoroCard from '@/components/PomodoroCard';
import GradientStatsCard from '@/components/GradientStatsCard';
import CourseCard from '@/components/CourseCard';
import CourseModal from '@/components/CourseModal';
import ChatBot from '@/components/ChatBot';
import StudyAssistant from '@/components/StudyAssistant';
import { Course, CourseColor, CourseExtractionResult, Deadline, ExtractedCourse, Task } from '@/types';
import { mockCourses, mockDeadlines, mockTasks } from '@/lib/mockData';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';
import { generateId } from '@/lib/utils';

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

  const withValidDate = parsedDeadlines.filter(item => item.timestamp !== null).sort((a, b) => (a.timestamp! - b.timestamp!));
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

export default function Dashboard() {
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [deadlines, setDeadlines] = useState<Deadline[]>(mockDeadlines);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load persisted data
  useEffect(() => {
    const storedCourses = loadFromStorage<Course[]>(STORAGE_KEYS.courses, mockCourses);
    const storedTasks = loadFromStorage<Task[]>(STORAGE_KEYS.tasks, mockTasks);
    const storedDeadlines = loadFromStorage<Deadline[]>(STORAGE_KEYS.deadlines, mockDeadlines);

    setCourses(storedCourses);
    setTasks(storedTasks);
    setDeadlines(storedDeadlines);
    setIsHydrated(true);
  }, []);

  // Persist changes
  useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(STORAGE_KEYS.courses, courses);
  }, [courses, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(STORAGE_KEYS.tasks, tasks);
  }, [tasks, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(STORAGE_KEYS.deadlines, deadlines);
  }, [deadlines, isHydrated]);

  // Keep course progress in sync with tasks
  useEffect(() => {
    if (!isHydrated) return;

    setCourses(prevCourses =>
      prevCourses.map(course => {
        const courseTasks = tasks.filter(task => task.courseId === course.id);

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
    tasksCompleted: tasks.filter(task => task.completed).length,
    totalTasks: tasks.length,
    upcomingDeadlines: deadlines.length,
    activeCourses: courses.length,
  }), [courses, deadlines, tasks]);

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

  const handleDeleteCourse = (id: string) => {
    if (confirm('Are you sure you want to delete this course?')) {
      setCourses(courses.filter(c => c.id !== id));
      setTasks(tasks.filter(task => task.courseId !== id));
      setDeadlines(deadlines.filter(deadline => deadline.courseId !== id));
    }
  };

  const handleSaveCourse = (courseData: Partial<Course>) => {
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
      setCourses([...courses, newCourse]);
    } else {
      setCourses(courses.map(c =>
        c.id === courseData.id
          ? { ...c, ...courseData } as Course
          : c
      ));
    }
  };

  const handleAssistantStructuredData = (data: CourseExtractionResult) => {
    if (!data?.courses || data.courses.length === 0) {
      return;
    }

    const newCourses: Course[] = [];
    const newTasks: Task[] = [];
    const newDeadlines: Deadline[] = [];

    data.courses.forEach((extractedCourse, index) => {
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

    if (newCourses.length > 0) {
      setCourses(prev => [...prev, ...newCourses]);
    }
    if (newTasks.length > 0) {
      setTasks(prev => [...prev, ...newTasks]);
    }
    if (newDeadlines.length > 0) {
      setDeadlines(prev => [...prev, ...newDeadlines]);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar courses={courses} />

      <main className="ml-64 pb-24">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary-600 mb-2">Welcome back!</h1>
            <p className="text-gray-600">Here's your academic overview</p>
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
              iconBg="bg-white"
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
              iconBg="bg-white"
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
              iconBg="bg-white"
            />
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
              <div className="card p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first course</p>
                <button onClick={handleCreateCourse} className="btn btn-primary">
                  Add Your First Course
                </button>
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

          {/* AI Study Assistant */}
          <StudyAssistant onStructuredData={handleAssistantStructuredData} />
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

      {/* General AI ChatBot */}
      <ChatBot />
    </div>
  );
}
