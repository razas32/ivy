'use client';

import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import MarkdownContent from './MarkdownContent';
import FlashcardView from './FlashcardView';
import QuizView from './QuizView';
import TypingIndicator from './TypingIndicator';
import { CourseExtractionResult, Flashcard, QuizQuestion } from '@/types';

interface StudyAssistantProps {
  onStructuredData?: (data: CourseExtractionResult) => void | Promise<void>;
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
  onFlashcardsGenerated?: (cards: Flashcard[]) => void | Promise<void>;
  onQuizGenerated?: (questions: QuizQuestion[]) => void | Promise<void>;
  fullHeight?: boolean;
  immersive?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  file?: string;
}

type TabType = 'chat' | 'flashcards' | 'quizzes';
type GenerationType = 'chat' | 'course' | 'flashcards' | 'quiz';
type ChatPayload = {
  messages: { role: 'user' | 'assistant'; content: string }[];
  fileContent: string;
  generationType: GenerationType;
};
type ChatResponse = {
  message?: string;
  structuredData?: CourseExtractionResult;
  flashcards?: Flashcard[];
  quizQuestions?: QuizQuestion[];
};
type ChatStreamEvent = {
  type: 'delta' | 'done' | 'error';
  content?: string;
  message?: string;
  error?: string;
};

export default function StudyAssistant({
  onStructuredData,
  flashcards,
  quizQuestions,
  onFlashcardsGenerated,
  onQuizGenerated,
  fullHeight = false,
  immersive = false,
}: StudyAssistantProps) {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [generationType, setGenerationType] = useState<GenerationType>('chat');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm Ivy, your AI study assistant. I can help you summarize lecture notes, create flashcards, and generate quizzes. What would you like to work on today?",
    },
  ]);
  const [pendingGeneration, setPendingGeneration] = useState<GenerationType | null>(null);
  const [lastPayload, setLastPayload] = useState<ChatPayload | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isStreamingResponse, setIsStreamingResponse] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const requestAbortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const autoSizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    const maxHeight = 160;
    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target || !isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const droppedFile = files[0];
      const acceptedTypes = ['.pdf', '.txt'];
      const fileExtension = '.' + droppedFile.name.split('.').pop()?.toLowerCase();

      if (acceptedTypes.includes(fileExtension)) {
        setFile(droppedFile);
      }
    }
  };

  const updateAssistantContent = (messageId: string, content: string) => {
    setMessages(prev =>
      prev.map(msg => (msg.id === messageId ? { ...msg, content } : msg))
    );
  };

  const isAbortError = (error: unknown) => {
    return (
      error instanceof DOMException && error.name === 'AbortError'
    ) || (error instanceof Error && error.name === 'AbortError');
  };

  const clearActiveRequest = () => {
    requestAbortRef.current = null;
    setIsStreamingResponse(false);
  };

  const scrollChatToBottom = () => {
    const container = chatScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  };

  const beginRequest = () => {
    requestAbortRef.current?.abort();
    const controller = new AbortController();
    requestAbortRef.current = controller;
    return controller;
  };

  useEffect(() => {
    if (activeTab !== 'chat' || !shouldAutoScroll) return;
    const frame = window.requestAnimationFrame(() => {
      scrollChatToBottom();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, isThinking, activeTab, shouldAutoScroll]);

  useEffect(() => {
    return () => {
      requestAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    autoSizeTextarea();
  }, [message]);

  const handleChatScroll = () => {
    const container = chatScrollRef.current;
    if (!container) return;
    const distanceToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShouldAutoScroll(distanceToBottom < 80);
  };

  const requestChat = async (
    payload: ChatPayload,
    options?: { onDelta?: (chunk: string) => void; signal?: AbortSignal }
  ): Promise<ChatResponse> => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: options?.signal,
    });

    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ivy-auth-required'));
      throw new Error('Sign in required.');
    }

    const contentType = response.headers.get('content-type') || '';
    if (payload.generationType === 'chat' && contentType.includes('text/event-stream')) {
      if (!response.body) {
        throw new Error('No response stream received.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const eventBlock of events) {
          const line = eventBlock
            .split('\n')
            .map(row => row.trim())
            .find(row => row.startsWith('data: '));
          if (!line) continue;

          const data = line.slice(6);
          let parsed: ChatStreamEvent;
          try {
            parsed = JSON.parse(data) as ChatStreamEvent;
          } catch {
            continue;
          }

          if (parsed.type === 'delta' && parsed.content) {
            accumulated += parsed.content;
            options?.onDelta?.(accumulated);
          }

          if (parsed.type === 'error') {
            throw new Error(parsed.error || 'Unable to stream response right now.');
          }

          if (parsed.type === 'done') {
            return { message: parsed.message || accumulated };
          }
        }
      }

      return { message: accumulated };
    }

    const data = (await response.json()) as ChatResponse & { error?: string };
    if (!response.ok) {
      throw new Error(data?.error || 'Unable to generate a response right now.');
    }

    return data;
  };

  const applyGeneratedData = (data: ChatResponse, requestGenerationType: GenerationType) => {
    if (data.structuredData) {
      onStructuredData?.(data.structuredData);
    }

    if (requestGenerationType === 'flashcards' && data.flashcards?.length) {
      onFlashcardsGenerated?.(data.flashcards);
      setActiveTab('flashcards');
    }

    if (requestGenerationType === 'quiz' && data.quizQuestions?.length) {
      onQuizGenerated?.(data.quizQuestions);
      setActiveTab('quizzes');
    }
  };

  const createErrorMessage = (error: unknown): Message => ({
    id: (Date.now() + 1).toString(),
    role: 'assistant',
    content:
      error instanceof Error && error.message
        ? `I hit a temporary issue: ${error.message}`
        : 'I hit a temporary issue while processing that. Please try again.',
  });
  const removeTrailingEmptyAssistant = () => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant' && !last.content.trim()) {
        return prev.slice(0, -1);
      }
      return prev;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isThinking) return;
    if (!message.trim() && !file) return;

    const requestGenerationType: GenerationType = generationType;
    setPendingGeneration(requestGenerationType);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      file: file?.name,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    const currentFile = file;
    setMessage('');
    setFile(null);
    setIsThinking(true);
    setShouldAutoScroll(true);
    const controller = beginRequest();

    try {
      const fileContent = currentFile ? await readFileContent(currentFile, controller.signal) : '';
      const payload: ChatPayload = {
        messages: newMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        fileContent,
        generationType: requestGenerationType,
      };
      setLastPayload(payload);

      const assistantId = (Date.now() + 1).toString();
      if (requestGenerationType === 'chat') {
        setIsStreamingResponse(true);
        setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);
      }

      const data = await requestChat(payload, {
        onDelta:
          requestGenerationType === 'chat'
            ? (partial) => updateAssistantContent(assistantId, partial)
            : undefined,
        signal: controller.signal,
      });

      if (requestGenerationType === 'chat') {
        updateAssistantContent(
          assistantId,
          data.message?.trim() || 'I ran into an issue and could not generate a response.'
        );
      } else {
        const aiMessage: Message = {
          id: assistantId,
          role: 'assistant',
          content: data.message || 'I ran into an issue and could not generate a response.',
        };
        setMessages(prev => [...prev, aiMessage]);
      }
      applyGeneratedData(data, requestGenerationType);
    } catch (error) {
      console.error('Chat error:', error);
      removeTrailingEmptyAssistant();
      if (!isAbortError(error)) {
        setMessages(prev => [...prev, createErrorMessage(error)]);
      }
    } finally {
      setIsThinking(false);
      setPendingGeneration(null);
      clearActiveRequest();
    }
  };

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      window.setTimeout(() => {
        setCopiedMessageId(prev => (prev === messageId ? null : prev));
      }, 1600);
    } catch {
      setCopiedMessageId(null);
    }
  };

  const handleRegenerate = async (messageId: string) => {
    if (isThinking || !lastPayload) return;

    const isLatestAssistant = messages[messages.length - 1]?.id === messageId && messages[messages.length - 1]?.role === 'assistant';
    if (!isLatestAssistant) return;

    setMessages(prev => prev.slice(0, -1));
    setIsThinking(true);
    setPendingGeneration(lastPayload.generationType);
    setShouldAutoScroll(true);
    const controller = beginRequest();

    try {
      const regeneratedId = (Date.now() + 1).toString();
      if (lastPayload.generationType === 'chat') {
        setIsStreamingResponse(true);
        setMessages(prev => [...prev, { id: regeneratedId, role: 'assistant', content: '' }]);
      }

      const data = await requestChat(lastPayload, {
        onDelta:
          lastPayload.generationType === 'chat'
            ? (partial) => updateAssistantContent(regeneratedId, partial)
            : undefined,
        signal: controller.signal,
      });

      if (lastPayload.generationType === 'chat') {
        updateAssistantContent(
          regeneratedId,
          data.message?.trim() || 'I ran into an issue and could not regenerate a response.'
        );
      } else {
        const regeneratedMessage: Message = {
          id: regeneratedId,
          role: 'assistant',
          content: data.message || 'I ran into an issue and could not regenerate a response.',
        };
        setMessages(prev => [...prev, regeneratedMessage]);
      }
      applyGeneratedData(data, lastPayload.generationType);
    } catch (error) {
      console.error('Regeneration error:', error);
      removeTrailingEmptyAssistant();
      if (!isAbortError(error)) {
        setMessages(prev => [...prev, createErrorMessage(error)]);
      }
    } finally {
      setIsThinking(false);
      setPendingGeneration(null);
      clearActiveRequest();
    }
  };

  const stopGeneration = () => {
    requestAbortRef.current?.abort();
  };

  const readFileContent = async (file: File, signal?: AbortSignal): Promise<string> => {
    const formData = new FormData();
    formData.set('file', file);

    const response = await fetch('/api/uploads/extract', {
      method: 'POST',
      body: formData,
      signal,
    });

    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ivy-auth-required'));
      throw new Error('Sign in required.');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'Failed to process file.');
    }

    return data.text || '';
  };

  const quickActions: { icon: string; label: string; prompt: string; type: GenerationType; tab: TabType }[] = [
    { icon: '💬', label: 'Ask Ivy', prompt: 'Explain this topic in simple terms.', type: 'chat', tab: 'chat' },
    { icon: '📝', label: 'Ingest Outline', prompt: 'Extract courses, deadlines, and tasks from this outline.', type: 'course', tab: 'chat' },
    { icon: '🎴', label: 'Create Flashcards', prompt: 'Create concise flashcards for key concepts.', type: 'flashcards', tab: 'flashcards' },
    { icon: '📊', label: 'Generate Quiz', prompt: 'Generate 8 quiz questions (mix true/false and fill-in-the-blank) with answers.', type: 'quiz', tab: 'quizzes' },
  ];
  const compactQuickActions = quickActions.filter(action => action.label !== 'Ask Ivy');
  const visibleQuickActions = immersive ? compactQuickActions : quickActions;
  const lastAssistantId = [...messages].reverse().find(msg => msg.role === 'assistant')?.id;
  const showAssistantTitle = !immersive;

  return (
    <div className={fullHeight ? 'h-full' : 'mt-10 mb-20'}>
      <div
        className={immersive ? 'overflow-hidden relative h-full flex flex-col rounded-none border-x-0 border-b-0 border-gray-200/80 bg-white shadow-none' : 'card overflow-hidden relative border border-gray-200/80 h-full flex flex-col'}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className={immersive ? 'absolute inset-0 bg-primary-50 bg-opacity-95 border-4 border-dashed border-primary-500 rounded-none flex items-center justify-center z-50 pointer-events-none' : 'absolute inset-0 bg-primary-50 bg-opacity-95 border-4 border-dashed border-primary-500 rounded-xl flex items-center justify-center z-50 pointer-events-none'}>
            <div className="text-center">
              <svg className="w-16 h-16 text-primary-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-xl font-semibold text-primary-700">Drop your file here</p>
              <p className="text-sm text-primary-600 mt-2">PDF or TXT up to 10MB</p>
            </div>
          </div>
        )}
        <div className={fullHeight ? 'border-b border-gray-200/80 bg-white/90 p-4' : 'border-b border-gray-200/80 bg-white/75 p-7'}>
          {showAssistantTitle && (
            <div className="flex items-center gap-2 mb-5">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m9-9h-2M5 12H3m13.657-6.657l-1.414 1.414M8.757 15.243l-1.414 1.414m9.9 0-1.414-1.414M8.757 8.757 7.343 7.343M9 9h6v6H9V9z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900">AI Study Assistant</h2>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab('chat');
                setGenerationType('chat');
              }}
              className={`flex-1 py-3 px-4 ${immersive ? 'rounded-xl' : 'rounded-xl'} font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                activeTab === 'chat'
                  ? 'bg-ivy-gradient text-white shadow-sm'
                  : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => {
                setActiveTab('flashcards');
                setGenerationType('flashcards');
                setPendingGeneration(null);
              }}
              className={`flex-1 py-3 px-4 ${immersive ? 'rounded-xl' : 'rounded-xl'} font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                activeTab === 'flashcards'
                  ? 'bg-ivy-gradient text-white shadow-sm'
                  : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80'
              }`}
            >
              Flashcards
            </button>
            <button
              onClick={() => {
                setActiveTab('quizzes');
                setGenerationType('quiz');
                setPendingGeneration(null);
              }}
              className={`flex-1 py-3 px-4 ${immersive ? 'rounded-xl' : 'rounded-xl'} font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                activeTab === 'quizzes'
                  ? 'bg-ivy-gradient text-white shadow-sm'
                  : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80'
              }`}
            >
              Quizzes
            </button>
          </div>
        </div>

        <div
          ref={chatScrollRef}
          onScroll={handleChatScroll}
          className={fullHeight ? 'flex-1 min-h-0 overflow-y-auto bg-[#f7faf8]' : 'h-[500px] overflow-y-auto bg-[#f7faf8]'}
        >
          {activeTab === 'chat' && (
            <div className={fullHeight ? "p-5" : "p-6"}>
              {messages.map((msg) =>
                msg.role === 'assistant' ? (
                  <div key={msg.id} className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m9-9h-2M5 12H3m13.657-6.657l-1.414 1.414M8.757 15.243l-1.414 1.414m9.9 0-1.414-1.414M8.757 8.757 7.343 7.343M9 9h6v6H9V9z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-primary-600">Ivy</span>
                        <div className="ml-auto flex items-center gap-2">
                          {msg.content.trim().length > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                            >
                              {copiedMessageId === msg.id ? 'Copied' : 'Copy'}
                            </button>
                          ) : null}
                          {msg.id === lastAssistantId && !isThinking && msg.content.trim().length > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleRegenerate(msg.id)}
                              className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                            >
                              Regenerate
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className={immersive ? 'bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm min-h-[56px]' : 'bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm min-h-[56px]'}>
                        {msg.content.trim().length > 0 ? (
                          <MarkdownContent content={msg.content} className="text-sm leading-relaxed text-gray-900" />
                        ) : (
                          <div className="h-5" />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <MessageBubble
                    key={msg.id}
                    id={msg.id}
                    role={msg.role}
                    content={msg.content}
                    file={msg.file}
                  />
                )
              )}
              {isThinking && !isStreamingResponse && <TypingIndicator />}
            </div>
          )}

          {activeTab === 'flashcards' && (
            <FlashcardView
              flashcards={flashcards}
              isGenerating={pendingGeneration === 'flashcards' && isThinking}
              onClear={() => onFlashcardsGenerated?.([])}
            />
          )}
          {activeTab === 'quizzes' && (
            <QuizView
              questions={quizQuestions}
              isGenerating={pendingGeneration === 'quiz' && isThinking}
              onClear={() => onQuizGenerated?.([])}
            />
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className={fullHeight ? "border-t border-gray-200/80 bg-white/95 p-4" : "border-t border-gray-200/80 bg-white/90 p-6"}
        >
          {file && (
            <div className={immersive ? 'mb-3 flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg w-fit' : 'mb-3 flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg w-fit'}>
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm text-gray-700">{file.name}</span>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                aria-label="Remove attached file"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex items-start gap-2">
            <input
              type="file"
              id="chat-file-upload"
              className="hidden"
              accept=".pdf,.txt"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="chat-file-upload"
              className={immersive ? 'flex-shrink-0 p-3 border border-gray-300 rounded-xl cursor-pointer h-[46px] flex items-center justify-center focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500' : 'flex-shrink-0 p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer h-[46px] flex items-center justify-center focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500'}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </label>

            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask Ivy to help with your studies..."
                className={immersive ? 'w-full min-h-[46px] max-h-40 px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none overflow-hidden leading-5' : 'w-full min-h-[46px] max-h-40 px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none overflow-hidden leading-5'}
                rows={1}
              />

              {isThinking ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className={immersive ? 'absolute right-2 bottom-2 p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2' : 'absolute right-2 bottom-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2'}
                  aria-label="Stop generating response"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <rect x="5" y="5" width="10" height="10" rx="1.5" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={(!message.trim() && !file) || isThinking}
                  className={immersive ? 'absolute right-2 bottom-2 p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2' : 'absolute right-2 bottom-2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {(immersive || (!fullHeight && !immersive)) && (
            <div className="flex flex-wrap gap-2 mt-4">
            {visibleQuickActions.map((action, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setMessage(action.prompt);
                  setGenerationType(action.type);
                  setActiveTab(action.tab);
                }}
                className={immersive
                  ? 'flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'
                  : 'flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'}
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
