'use client';

type NoticeTone = 'error' | 'info' | 'success' | 'neutral';

const TONE_STYLES: Record<NoticeTone, string> = {
  error: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-primary-200 bg-primary-50 text-primary-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  neutral: 'border-gray-200 bg-white text-gray-700',
};

interface AppNoticeProps {
  children: React.ReactNode;
  tone?: NoticeTone;
  className?: string;
}

export default function AppNotice({ children, tone = 'neutral', className = '' }: AppNoticeProps) {
  return (
    <div className={`rounded-xl border p-4 text-sm ${TONE_STYLES[tone]} ${className}`.trim()}>
      {children}
    </div>
  );
}
