'use client';

import { useState } from 'react';
import MessageBubble from './MessageBubble';
import FlashcardView from './FlashcardView';
import QuizView from './QuizView';
import { CourseExtractionResult } from '@/types';

interface StudyAssistantProps {
  onStructuredData?: (data: CourseExtractionResult) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  file?: string;
}

type TabType = 'chat' | 'flashcards' | 'quizzes';

export default function StudyAssistant({ onStructuredData }: StudyAssistantProps = {}) {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm Ivy, your AI study assistant. I can help you summarize lecture notes, create flashcards, and generate quizzes. What would you like to work on today?",
    },
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
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
      const acceptedTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];
      const fileExtension = '.' + droppedFile.name.split('.').pop()?.toLowerCase();

      if (acceptedTypes.includes(fileExtension)) {
        setFile(droppedFile);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !file) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      file: file?.name,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Reset form immediately
    const currentFile = file;
    setMessage('');
    setFile(null);

    try {
      // Read file content if present
      let fileContent = '';
      if (currentFile) {
        console.log('Reading file:', currentFile.name, currentFile.type);
        fileContent = await readFileContent(currentFile);
        console.log('File content length:', fileContent.length);
      }

      // Call API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          fileContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json() as {
        message?: string;
        structuredData?: CourseExtractionResult;
      };

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'I apologize, but I encountered an error processing your request.',
      };

      setMessages(prev => [...prev, aiMessage]);

      if (data.structuredData && onStructuredData) {
        onStructuredData(data.structuredData);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Please try again.'}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const readFileContent = async (file: File): Promise<string> => {
    // Check if file is a PDF
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      return await readPDFContent(file);
    }

    // For non-PDF files, read as text
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const readPDFContent = async (file: File): Promise<string> => {
    try {
      const pdfjsLib = await getPdfJs();

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = '';

      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }

      return fullText;
    } catch (error) {
      console.error('Error reading PDF:', error);
      throw new Error('Failed to read PDF file');
    }
  };

  const getPdfJs = (() => {
    let loader: Promise<typeof import('pdfjs-dist')> | null = null;

    return async () => {
      if (!loader) {
        loader = import('pdfjs-dist').then(pdfjs => {
          if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
            pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
          }
          return pdfjs;
        });
      }

      return loader;
    };
  })();

  const quickActions = [
    { icon: '📝', label: 'Summarize Notes' },
    { icon: '🎴', label: 'Create Flashcards' },
    { icon: '📊', label: 'Generate Quiz' },
  ];

  return (
    <div className="mt-12 mb-24">
      {/* Main Card */}
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900">AI Study Assistant</h2>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 px-4 rounded-full font-medium text-sm transition-all ${
                activeTab === 'chat'
                  ? 'bg-primary-600 text-primary-600 bg-opacity-10 shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`flex-1 py-3 px-4 rounded-full font-medium text-sm transition-all ${
                activeTab === 'flashcards'
                  ? 'bg-primary-600 text-primary-600 bg-opacity-10 shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Flashcards
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`flex-1 py-3 px-4 rounded-full font-medium text-sm transition-all ${
                activeTab === 'quizzes'
                  ? 'bg-primary-600 text-primary-600 bg-opacity-10 shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Quizzes
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="h-[500px] overflow-y-auto bg-gray-50">
          {activeTab === 'chat' && (
            <div className="p-6">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  file={msg.file}
                />
              ))}
            </div>
          )}

          {activeTab === 'flashcards' && <FlashcardView />}
          {activeTab === 'quizzes' && <QuizView />}
        </div>

        {/* Input Area - Always Visible */}
        <form
          onSubmit={handleSubmit}
          className="relative border-t border-gray-200 bg-white p-6"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag Overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-primary-50 bg-opacity-90 border-4 border-dashed border-primary-500 rounded-2xl flex items-center justify-center z-50 pointer-events-none">
              <div className="text-center">
                <svg className="w-16 h-16 text-primary-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-xl font-semibold text-primary-700">Drop your file here</p>
                <p className="text-sm text-primary-600 mt-2">PDF, DOC, DOCX, TXT, JPG, PNG</p>
              </div>
            </div>
          )}

          {/* File Upload Preview */}
          {file && (
            <div className="mb-3 flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg w-fit">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm text-gray-700">{file.name}</span>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-start gap-2">
            {/* Attachment Button */}
            <input
              type="file"
              id="chat-file-upload"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="chat-file-upload"
              className="flex-shrink-0 p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer h-[46px] flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </label>

            <div className="relative flex-1">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask Ivy to help with your studies..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={1}
              />

              <button
                type="submit"
                disabled={!message.trim() && !file}
                className="absolute right-2 bottom-2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setMessage(action.label)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
