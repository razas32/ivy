'use client';

import { useRouter } from 'next/navigation';

export default function PomodoroCard() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push('/pomodoro')}
      className="relative overflow-hidden rounded-2xl p-6 w-full text-left border border-white/15 group shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
      aria-label="Open Pomodoro timer"
      style={{
        background: 'linear-gradient(135deg, #dc3e44 0%, #ea6d2f 100%)',
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_52%)] pointer-events-none opacity-90 transition-opacity duration-200 group-hover:opacity-100" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center border border-white/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex items-center gap-1 text-white/90 text-sm">
            <span>Open</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <p className="text-white/85 text-sm font-medium">Focus Timer</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-white text-4xl font-bold">25:00</span>
          <span className="text-white/80 text-sm">session</span>
        </div>
      </div>
    </button>
  );
}
