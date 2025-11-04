'use client';

import { useState } from 'react';

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export default function FlashcardView() {
  const [flashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (flashcards.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="bg-primary-100 p-4 rounded-full mb-4">
          <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No flashcards yet</h3>
        <p className="text-sm text-gray-600 max-w-md">
          Upload your notes or lecture materials in the chat and ask me to create flashcards for you.
        </p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="mb-4 text-sm text-gray-600">
        Card {currentIndex + 1} of {flashcards.length}
      </div>

      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full max-w-2xl h-64 cursor-pointer perspective-1000"
      >
        <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          <div className="absolute inset-0 bg-white border-2 border-gray-200 rounded-xl p-8 flex items-center justify-center backface-hidden shadow-lg">
            <p className="text-lg text-center text-gray-900">{currentCard.front}</p>
          </div>
          <div className="absolute inset-0 bg-primary-50 border-2 border-primary-200 rounded-xl p-8 flex items-center justify-center rotate-y-180 backface-hidden shadow-lg">
            <p className="text-lg text-center text-gray-900">{currentCard.back}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="btn btn-secondary disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentIndex(Math.min(flashcards.length - 1, currentIndex + 1))}
          disabled={currentIndex === flashcards.length - 1}
          className="btn btn-secondary disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
