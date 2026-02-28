'use client';

import { useEffect, useState } from 'react';
import {
  clearStoredOpenAIKey,
  getMaskedOpenAIKey,
  getStoredOpenAIKey,
  saveStoredOpenAIKey,
} from '@/lib/openaiKey';

const SETTINGS_EVENT = 'ivy-openai-settings';
const KEY_UPDATED_EVENT = 'ivy-openai-key-updated';

function looksLikeOpenAIKey(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith('sk-') && trimmed.length >= 20;
}

export default function OpenAIKeySettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [draftKey, setDraftKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const existingKey = getStoredOpenAIKey();
    setDraftKey(existingKey);
    setSavedKey(existingKey);
    setFeedback(null);
  }, [isOpen]);

  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener(SETTINGS_EVENT, open);
    return () => window.removeEventListener(SETTINGS_EVENT, open);
  }, []);

  const notifyKeyUpdated = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event(KEY_UPDATED_EVENT));
  };

  const saveKey = () => {
    const trimmed = draftKey.trim();

    if (!trimmed) {
      clearStoredOpenAIKey();
      setDraftKey('');
      setSavedKey('');
      notifyKeyUpdated();
      setFeedback('Removed the local API key. Requests will use the server default when available.');
      return;
    }

    if (!looksLikeOpenAIKey(trimmed)) {
      setFeedback('That does not look like a valid OpenAI API key.');
      return;
    }

    saveStoredOpenAIKey(trimmed);
    setDraftKey(trimmed);
    setSavedKey(trimmed);
    notifyKeyUpdated();
    setFeedback('Saved locally in this browser. Future AI requests will use your key first.');
  };

  const clearKey = () => {
    clearStoredOpenAIKey();
    setDraftKey('');
    setSavedKey('');
    notifyKeyUpdated();
    setFeedback('Removed the local API key.');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100/80 transition-colors"
        data-auth-exempt="true"
      >
        <span className="flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4v-3l5.257-5.257A6 6 0 1121 9z" />
          </svg>
          <span className="text-sm font-medium">AI Key</span>
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {savedKey ? 'Custom' : 'Default'}
        </span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4"
          data-auth-exempt="true"
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
            data-auth-exempt="true"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Bring Your Own OpenAI Key</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Your key is stored only in this browser via local storage and is sent with your AI requests. It is not saved in Supabase.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                data-auth-exempt="true"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-gray-200 bg-surface-50 p-3 text-sm text-gray-700">
                Current key: <span className="font-medium">{getMaskedOpenAIKey(savedKey)}</span>
              </div>

              <div>
                <label htmlFor="openai-api-key" className="mb-1 block text-sm font-medium text-gray-700">
                  OpenAI API key
                </label>
                <input
                  id="openai-api-key"
                  type="password"
                  value={draftKey}
                  onChange={(event) => setDraftKey(event.target.value)}
                  placeholder="sk-..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoComplete="off"
                  spellCheck={false}
                  data-auth-exempt="true"
                />
              </div>

              <p className="text-xs text-gray-500">
                Leave this blank to fall back to the server key when one is configured.
              </p>

              {feedback && (
                <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700">
                  {feedback}
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={saveKey}
                className="flex-1 rounded-lg bg-ivy-gradient px-4 py-2.5 font-semibold text-white"
                data-auth-exempt="true"
              >
                Save Key
              </button>
              <button
                type="button"
                onClick={clearKey}
                className="rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700"
                data-auth-exempt="true"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
