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
    isOpen ? (
      <div
        className="fixed inset-0 z-[120] overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.78),rgba(15,23,42,0.64))]"
        data-auth-exempt="true"
      >
        <div className="min-h-screen p-4 md:p-8" data-auth-exempt="true">
          <div
            className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl flex-col rounded-[28px] border border-white/20 bg-white shadow-2xl md:min-h-[calc(100vh-4rem)]"
            data-auth-exempt="true"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5 md:px-8">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">AI Settings</p>
                <h2 className="mt-2 text-3xl font-bold text-gray-900">Bring Your Own OpenAI Key</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Your key is stored only in this browser via local storage and is sent with your AI requests. It is not saved in Supabase.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                data-auth-exempt="true"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-0 lg:grid-cols-[1.1fr_0.9fr]" data-auth-exempt="true">
              <section className="border-b border-gray-200 p-6 md:p-8 lg:border-b-0 lg:border-r">
                <div className="space-y-6">
                  <div className="rounded-2xl border border-gray-200 bg-surface-50 p-4">
                    <p className="text-sm font-semibold text-gray-900">Current key</p>
                    <p className="mt-1 text-sm text-gray-600">{getMaskedOpenAIKey(savedKey)}</p>
                  </div>

                  <div>
                    <label htmlFor="openai-api-key" className="mb-2 block text-sm font-medium text-gray-700">
                      OpenAI API key
                    </label>
                    <input
                      id="openai-api-key"
                      type="password"
                      value={draftKey}
                      onChange={(event) => setDraftKey(event.target.value)}
                      placeholder="sk-..."
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      autoComplete="off"
                      spellCheck={false}
                      data-auth-exempt="true"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Leave this blank to fall back to the server key when one is configured.
                    </p>
                  </div>

                  {feedback && (
                    <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
                      {feedback}
                    </div>
                  )}
                </div>
              </section>

              <aside className="bg-surface-50/70 p-6 md:p-8">
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">How it works</h3>
                    <ul className="mt-3 space-y-3 text-sm text-gray-600">
                      <li>Your key stays in this browser only.</li>
                      <li>AI requests use your saved key before the server default.</li>
                      <li>Removing the key immediately returns requests to server fallback behavior.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Recommended use</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Use a personal or project-scoped key when self-hosting Ivy so contributors and users do not depend on a single shared server credential.
                    </p>
                  </div>
                </div>
              </aside>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-5 md:flex-row md:justify-end md:px-8">
              <button
                type="button"
                onClick={clearKey}
                className="rounded-xl border border-gray-300 px-4 py-3 font-medium text-gray-700"
                data-auth-exempt="true"
              >
                Remove Key
              </button>
              <button
                type="button"
                onClick={saveKey}
                className="rounded-xl bg-ivy-gradient px-5 py-3 font-semibold text-white"
                data-auth-exempt="true"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : null
  );
}
