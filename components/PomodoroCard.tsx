'use client';

import { useRouter } from 'next/navigation';

export default function PomodoroCard() {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push('/pomodoro')}
      className="relative overflow-hidden rounded-xl p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-2xl group"
      style={{
        background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
      }}
    >
      {/* Decorative Icons Background */}
      <div className="absolute top-0 right-0 opacity-10 transform rotate-12">
        <svg className="w-32 h-32 text-white -mr-8 -mt-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 opacity-10">
        <svg className="w-24 h-24 text-white -ml-6 -mb-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex items-center gap-1 text-white text-sm opacity-80">
            <span>Start Focus</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <div className="mb-2">
          <h3 className="text-white text-sm font-medium opacity-90 mb-1">Pomodoro Timer</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-white text-4xl font-bold">25:00</span>
            <span className="text-white text-sm opacity-75">min</span>
          </div>
        </div>

        <p className="text-white text-xs opacity-75">
          Click to start a focused work session
        </p>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
    </div>
  );
}
