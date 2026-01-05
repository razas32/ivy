'use client';

import { useEffect, useMemo, useState } from 'react';
import { QuizQuestion } from '@/types';

interface QuizViewProps {
  questions: QuizQuestion[];
  isGenerating?: boolean;
  onClear?: () => void;
}

export default function QuizView({ questions, isGenerating, onClear }: QuizViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [fillInput, setFillInput] = useState('');
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setFillInput('');
    setShowResult(false);
  }, [questions]);

  const hasQuestions = questions.length > 0;
  const safeIndex = Math.min(currentIndex, Math.max(questions.length - 1, 0));
  const currentQuestion = hasQuestions ? questions[safeIndex] : null;
  const options = useMemo(() => {
    if (!currentQuestion) return [];
    if (currentQuestion.type === 'truefalse') return ['True', 'False'];
    return currentQuestion.options || [];
  }, [currentQuestion]);

  const normalizedAnswer = currentQuestion?.answer?.trim().toLowerCase() || '';
  const userAnswer =
    currentQuestion?.type === 'fill'
      ? fillInput.trim().toLowerCase()
      : (selectedAnswer || '').trim().toLowerCase();
  const isCorrect = showResult && userAnswer !== '' && currentQuestion && userAnswer === normalizedAnswer;

  const goTo = (index: number) => {
    setCurrentIndex(index);
    setSelectedAnswer(null);
    setFillInput('');
    setShowResult(false);
  };

  if (isGenerating) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-600" />
        <p className="text-sm font-semibold text-gray-900">Generating quiz questions...</p>
        <p className="text-xs text-gray-600">This usually takes just a moment.</p>
      </div>
    );
  }

  if (!hasQuestions || !currentQuestion) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="bg-primary-100 p-4 rounded-full mb-4">
          <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No quizzes yet</h3>
        <p className="text-sm text-gray-600 max-w-md">
          Upload your study materials in the chat and ask me to generate a quiz for you.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-600">
            Question {currentIndex + 1} of {questions.length}
          </div>
          {onClear && (
            <button
              onClick={onClear}
              className="text-sm font-semibold text-red-600 hover:text-red-700"
            >
              Clear
            </button>
          )}
        </div>
        <h3 className="text-xl font-semibold text-gray-900">{currentQuestion.prompt}</h3>
      </div>

      <div className="space-y-3 flex-1 w-full">
        {currentQuestion.type === 'fill' ? (
          <div className="space-y-3">
            <input
              type="text"
              value={fillInput}
              onChange={(e) => {
                setFillInput(e.target.value);
                setShowResult(false);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Type your answer..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedAnswer(fillInput);
                  setShowResult(true);
                }}
                className="btn btn-primary"
                disabled={!fillInput.trim()}
              >
                Check
              </button>
              {showResult && (
                <span className={`text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {isCorrect ? 'Correct!' : `Answer: ${currentQuestion.answer}`}
                </span>
              )}
            </div>
          </div>
        ) : (
          options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedAnswer(option);
                setShowResult(true);
              }}
              disabled={showResult}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                showResult
                  ? option.trim().toLowerCase() === normalizedAnswer
                    ? 'border-green-500 bg-green-50'
                    : option === selectedAnswer
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200'
                  : selectedAnswer === option
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {option}
            </button>
          ))
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => goTo(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="btn btn-secondary disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => goTo(Math.min(questions.length - 1, currentIndex + 1))}
          disabled={currentIndex === questions.length - 1}
          className="btn btn-primary disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
