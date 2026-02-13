import MarkdownContent from './MarkdownContent';

interface MessageBubbleProps {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  file?: string;
  canRegenerate?: boolean;
  copied?: boolean;
  onCopy?: (messageId: string, content: string) => void;
  onRegenerate?: (messageId: string) => void;
}

export default function MessageBubble({
  id,
  role,
  content,
  file,
  canRegenerate = false,
  copied = false,
  onCopy,
  onRegenerate,
}: MessageBubbleProps) {
  if (role === 'assistant') {
    return (
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m9-9h-2M5 12H3m13.657-6.657l-1.414 1.414M8.757 15.243l-1.414 1.414m9.9 0-1.414-1.414M8.757 8.757 7.343 7.343M9 9h6v6H9V9z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-primary-600">Ivy</span>
            <div className="ml-auto flex items-center gap-2">
              {onCopy && id ? (
                <button
                  type="button"
                  onClick={() => onCopy(id, content)}
                  className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              ) : null}
              {onRegenerate && id && canRegenerate ? (
                <button
                  type="button"
                  onClick={() => onRegenerate(id)}
                  className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  Regenerate
                </button>
              ) : null}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
            <MarkdownContent content={content} className="text-sm leading-relaxed text-gray-900" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 mb-4 justify-end">
      <div className="flex-1 flex flex-col items-end">
        {file && (
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg mb-2">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm text-gray-700">{file}</span>
          </div>
        )}
        {content && (
          <div className="bg-primary-100 border border-primary-200 rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm max-w-2xl">
            <p className="text-gray-900 text-sm leading-relaxed">{content}</p>
          </div>
        )}
      </div>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    </div>
  );
}
