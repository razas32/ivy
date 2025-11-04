'use client';

import { useState } from 'react';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export default function QuizView() {
  const [questions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  if (questions.length === 0) {
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

  const currentQuestion = questions[currentIndex];

  return (
    <div className="h-full flex flex-col p-8">
      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-2">
          Question {currentIndex + 1} of {questions.length}
        </div>
        <h3 className="text-xl font-semibold text-gray-900">{currentQuestion.question}</h3>
      </div>

      <div className="space-y-3 flex-1">
        {currentQuestion.options.map((option, index) => (
          <button
            key={index}
            onClick={() => {
              setSelectedAnswer(index);
              setShowResult(true);
            }}
            disabled={showResult}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              showResult
                ? index === currentQuestion.correctAnswer
                  ? 'border-green-500 bg-green-50'
                  : index === selectedAnswer
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200'
                : selectedAnswer === index
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => {
            setCurrentIndex(Math.max(0, currentIndex - 1));
            setSelectedAnswer(null);
            setShowResult(false);
          }}
          disabled={currentIndex === 0}
          className="btn btn-secondary disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => {
            setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1));
            setSelectedAnswer(null);
            setShowResult(false);
          }}
          disabled={currentIndex === questions.length - 1}
          className="btn btn-primary disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
