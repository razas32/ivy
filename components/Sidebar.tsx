'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Course } from '@/types';
import { useAuth } from './AuthProvider';

interface SidebarProps {
  courses: Course[];
}

const navItemBase =
  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2';

export default function Sidebar({ courses }: SidebarProps) {
  const pathname = usePathname();
  const { isAuthenticated, openAuthModal, logout } = useAuth();

  const getCourseColorClass = (color: string) => {
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

  return (
    <aside className="w-64 h-screen bg-white/95 border-r border-gray-200/90 backdrop-blur-sm flex flex-col fixed left-0 top-0">
      <div className="p-5 border-b border-gray-200/80">
        <div className="flex justify-start pl-3">
          <Image
            src="/ivy_logo.png"
            alt="Ivy Logo"
            width={150}
            height={70}
            className="h-14 w-auto"
            priority
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-5 px-3">
        <div className="mb-6">
          <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 tracking-[0.12em] uppercase">Workspace</p>
          <div className="space-y-1">
            <Link
              href="/"
              className={`${navItemBase} ${
                pathname === '/'
                  ? 'bg-primary-50 text-primary-700 border border-primary-100'
                  : 'text-gray-700 hover:bg-gray-100/80'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link
              href="/calendar"
              className={`${navItemBase} ${
                pathname.startsWith('/calendar')
                  ? 'bg-primary-50 text-primary-700 border border-primary-100'
                  : 'text-gray-700 hover:bg-gray-100/80'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Calendar</span>
            </Link>
            <Link
              href="/ai"
              className={`${navItemBase} ${
                pathname.startsWith('/ai')
                  ? 'bg-primary-50 text-primary-700 border border-primary-100'
                  : 'text-gray-700 hover:bg-gray-100/80'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m9-9h-2M5 12H3m13.657-6.657l-1.414 1.414M8.757 15.243l-1.414 1.414m9.9 0-1.414-1.414M8.757 8.757 7.343 7.343M9 9h6v6H9V9z" />
              </svg>
              <span className="font-medium">AIvy</span>
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 tracking-[0.12em] uppercase">Courses</p>
          <div className="space-y-1">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className={`${navItemBase} ${
                  pathname === `/courses/${course.id}`
                    ? 'bg-primary-50 text-primary-700 border border-primary-100'
                    : 'text-gray-700 hover:bg-gray-100/80'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getCourseColorClass(course.color)}`} />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold truncate">{course.code}</p>
                  <p className="text-xs text-gray-500 truncate">{course.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 tracking-[0.12em] uppercase">Career</p>
          <div className="space-y-1">
            <Link
              href="/resume-analyzer"
              className={`${navItemBase} ${
                pathname.startsWith('/resume-analyzer')
                  ? 'bg-primary-50 text-primary-700 border border-primary-100'
                  : 'text-gray-700 hover:bg-gray-100/80'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium">Resume Analyzer</span>
            </Link>
            <Link
              href="/cover-letter-generator"
              className={`${navItemBase} ${
                pathname.startsWith('/cover-letter-generator')
                  ? 'bg-primary-50 text-primary-700 border border-primary-100'
                  : 'text-gray-700 hover:bg-gray-100/80'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-2 9H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium">Cover Letter</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="p-3 border-t border-gray-200/80">
        {isAuthenticated ? (
          <button
            onClick={logout}
            className={`${navItemBase} text-gray-700 hover:bg-gray-100/80`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H9m8 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            <span className="text-sm font-medium">Log Out</span>
          </button>
        ) : (
          <button
            onClick={openAuthModal}
            className={`${navItemBase} text-gray-700 hover:bg-gray-100/80`}
            data-auth-exempt="true"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m0 0l-4-4m4 4l-4 4M5 5h6a2 2 0 012 2v1M5 19h6a2 2 0 002-2v-1" />
            </svg>
            <span className="text-sm font-medium">Log In</span>
          </button>
        )}
      </div>
    </aside>
  );
}
