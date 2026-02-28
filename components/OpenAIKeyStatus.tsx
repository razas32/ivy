'use client';

import { useEffect, useState } from 'react';
import { getStoredOpenAIKey } from '@/lib/openaiKey';

const SETTINGS_EVENT = 'ivy-openai-settings';

export function openOpenAISettings() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SETTINGS_EVENT));
}

export default function OpenAIKeyStatus() {
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const sync = () => {
      setHasKey(Boolean(getStoredOpenAIKey()));
    };

    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('ivy-openai-key-updated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('ivy-openai-key-updated', sync);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white/85 p-4 backdrop-blur-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">OpenAI key source</p>
          <p className="text-sm text-gray-600">
            {hasKey
              ? 'Using your browser-stored API key for AI requests.'
              : 'No local key saved. Ivy will fall back to the server key when available.'}
          </p>
        </div>
        <button
          type="button"
          onClick={openOpenAISettings}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          data-auth-exempt="true"
        >
          {hasKey ? 'Manage Key' : 'Add Key'}
        </button>
      </div>
    </div>
  );
}
