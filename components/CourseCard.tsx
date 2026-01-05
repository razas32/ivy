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

  // Get deadline information for this course
  const courseDeadlines = deadlines.filter(d => d.courseId === course.id);
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
      className="card p-6 relative group cursor-pointer"
      onClick={() => router.push(`/courses/${course.id}`)}
    >
      {/* Course Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`${getCourseGradientClass(course.color)} text-white rounded-xl p-3 flex items-center justify-center shadow-inner`}>
          <span className="text-lg font-bold tracking-wide">
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
          <span className="font-medium">{course.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getCourseFillClass(course.color)}`}
            style={{ width: `${course.progress}%` }}
          />
        </div>
      </div>

      {/* Due Date (time-based, not tied to task completion) */}
      <div className="flex items-center gap-2">
        {deadlinesFinished ? (
          <>
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex flex-col">
              <span className="text-sm text-green-600 font-medium">Finished</span>
              {finishedDetail && (
                <span className="text-xs text-gray-600">{finishedDetail}</span>
              )}
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
            <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-gray-600'}`}>
              {deadlineText}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
