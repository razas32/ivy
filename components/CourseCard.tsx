'use client';

import { useRouter } from 'next/navigation';
import { Course, Deadline } from '@/types';
import { formatDeadlineDisplay, formatAbsoluteDeadlineDate, getDeadlineStatus, isDeadlineOverdue, isDeadlineUrgent } from '@/lib/deadlineUtils';

interface CourseCardProps {
  course: Course;
  deadlines: Deadline[];
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
}

export default function CourseCard({ course, deadlines, onEdit, onDelete }: CourseCardProps) {
  const router = useRouter();

  const getCourseGradientClass = (color: string) => {
    const gradientMap: Record<string, string> = {
      blue: 'bg-gradient-to-br from-blue-500 to-blue-700',
      purple: 'bg-gradient-to-br from-purple-500 to-purple-700',
      green: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
      orange: 'bg-gradient-to-br from-orange-500 to-orange-700',
      red: 'bg-gradient-to-br from-red-500 to-red-700',
      pink: 'bg-gradient-to-br from-pink-500 to-pink-700',
    };
    return gradientMap[color] || 'bg-gradient-to-br from-gray-400 to-gray-600';
  };

  const getCourseFillClass = (color: string) => {
    const map: Record<string, string> = {
      blue: 'bg-course-blue',
      purple: 'bg-course-purple',
      green: 'bg-course-green',
      orange: 'bg-course-orange',
      red: 'bg-course-red',
      pink: 'bg-course-pink',
    };
    return map[color] || 'bg-gray-500';
  };

  const courseDeadlines = deadlines.filter((d) => d.courseId === course.id);
  const { nextDeadline: upcomingDeadline, closestDeadline, isFinished: deadlinesFinished } = getDeadlineStatus(courseDeadlines);
  const deadlineForDisplay = upcomingDeadline || closestDeadline || null;
  const deadlineText = deadlinesFinished ? 'Finished' : formatDeadlineDisplay(deadlineForDisplay);
  const isOverdue = !deadlinesFinished && isDeadlineOverdue(deadlineText);
  const isUrgent = !deadlinesFinished && isDeadlineUrgent(deadlineText);
  const finishedDetail = deadlinesFinished
    ? formatAbsoluteDeadlineDate(closestDeadline) || closestDeadline?.title || null
    : null;

  return (
    <div
      className="card p-6 relative group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      onClick={() => router.push(`/courses/${course.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/courses/${course.id}`);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-4 mb-5">
        <div className={`${getCourseGradientClass(course.color)} text-white rounded-xl p-3 flex items-center justify-center shadow-sm`}>
          <span className="text-lg font-bold tracking-wide">{course.code.substring(0, 3)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.code}</h3>
          <p className="text-sm text-gray-600 truncate">{course.name}</p>
        </div>

        <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(course);
            }}
            className="p-2 text-gray-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            title="Edit course"
            aria-label={`Edit ${course.code}`}
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
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            title="Delete course"
            aria-label={`Delete ${course.code}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span className="font-semibold text-gray-800">{course.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all ${getCourseFillClass(course.color)}`}
            style={{ width: `${course.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {deadlinesFinished ? (
          <>
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex flex-col">
              <span className="text-sm text-green-700 font-semibold">Finished</span>
              {finishedDetail && <span className="text-xs text-gray-600">{finishedDetail}</span>}
            </div>
          </>
        ) : (
          <>
            <svg
              className={`w-4 h-4 ${isOverdue ? 'text-red-500' : isUrgent ? 'text-orange-500' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-gray-600'}`}>
              {deadlineText}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
