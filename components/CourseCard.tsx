'use client';

import { useRouter } from 'next/navigation';
import { Course } from '@/types';

interface CourseCardProps {
  course: Course;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
}

export default function CourseCard({ course, onEdit, onDelete }: CourseCardProps) {
  const router = useRouter();

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

  const isCompleted = course.progress === 100;

  return (
    <div
      className="card p-6 relative group cursor-pointer"
      onClick={() => router.push(`/courses/${course.id}`)}
    >
      {/* Course Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`${getCourseColorClass(course.color)} bg-opacity-10 border-2 rounded-xl p-3 flex items-center justify-center`}>
          <span className={`text-lg font-bold ${getTextColorClass(course.color)}`}>
            {course.code.substring(0, 3)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.code}</h3>
          <p className="text-sm text-gray-600">{course.name}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(course);
            }}
            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Edit course"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(course.id);
            }}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete course"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span className="font-medium">{course.tasksCompleted}/{course.totalTasks} tasks</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getCourseColorClass(course.color).split(' ')[0]}`}
            style={{ width: `${course.progress}%` }}
          />
        </div>
      </div>

      {/* Due Date */}
      <div className="flex items-center gap-2">
        {isCompleted ? (
          <>
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-green-600 font-medium">All caught up!</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-gray-600">Due {course.dueDate}</span>
          </>
        )}
      </div>
    </div>
  );
}
