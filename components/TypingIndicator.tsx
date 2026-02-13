'use client';

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m9-9h-2M5 12H3m13.657-6.657l-1.414 1.414M8.757 15.243l-1.414 1.414m9.9 0-1.414-1.414M8.757 8.757 7.343 7.343M9 9h6v6H9V9z" />
        </svg>
      </div>
      <div className="flex flex-col items-start w-fit">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-primary-600">Ivy</span>
          <span className="text-xs text-gray-400">is thinking…</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <div className="typing-indicator">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      </div>
    </div>
  );
}
