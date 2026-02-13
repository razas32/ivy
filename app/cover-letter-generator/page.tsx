'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import IvyGradient from '@/components/IvyGradient';
import { CoverLetterGenerationResult, Course } from '@/types';
import { mockCourses } from '@/lib/mockData';
import { fetchBootstrap, saveCareerAsset } from '@/lib/clientApi';

const tonePresets = [
  'confident and concise',
  'professional and warm',
  'direct and outcomes-focused',
  'collaborative and leadership-oriented',
];

export default function CoverLetterGenerator() {
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [jobDescription, setJobDescription] = useState('');
  const [resumeSummary, setResumeSummary] = useState('');
  const [tone, setTone] = useState(tonePresets[0]);
  const [result, setResult] = useState<CoverLetterGenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const data = await fetchBootstrap();
        setCourses(data.courses);
      } catch (_error) {}
    };

    run();
  }, []);

  const generate = async () => {
    if (!jobDescription.trim() || !resumeSummary.trim()) return;

    setError(null);
    setResult(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          resumeSummary,
          tone,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to generate cover letter.');
      }

      const payload: CoverLetterGenerationResult = {
        draft: data.draft || '',
        outline: data.outline || [],
        keywordsUsed: data.keywordsUsed || [],
      };

      setResult(payload);

      await saveCareerAsset({
        type: 'cover_letter',
        title: `Cover Letter ${new Date().toLocaleString()}`,
        content: payload,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyDraft = () => {
    if (!result?.draft) return;
    navigator.clipboard.writeText(result.draft);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-white to-surface-100">
      <Sidebar courses={courses} />

      <main className="ml-64 pb-24">
        <div className="max-w-7xl mx-auto px-8 py-10 space-y-8">
          <IvyGradient className="rounded-3xl p-8 text-white border border-primary-500/30">
            <h1 className="text-3xl font-bold !text-white">Cover Letter Generator</h1>
            <p className="text-white/90 mt-2">Generate a 300-400 word ATS-friendly draft from JD + resume summary.</p>
          </IvyGradient>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="card p-7 border border-gray-200/80 xl:col-span-2 space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Job Description</h2>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full min-h-[220px] border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Paste responsibilities, requirements, and context"
              />
            </div>

            <div className="card p-7 border border-gray-200/80 space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Resume Summary</h2>
              <textarea
                value={resumeSummary}
                onChange={(e) => setResumeSummary(e.target.value)}
                className="w-full min-h-[180px] border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Paste summary + top impact bullets"
              />

              <label className="text-sm font-medium text-gray-700" htmlFor="tone">Tone</label>
              <select
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                {tonePresets.map((preset) => (
                  <option key={preset} value={preset}>{preset}</option>
                ))}
              </select>

              <button
                onClick={generate}
                disabled={!jobDescription.trim() || !resumeSummary.trim() || isGenerating}
                className="w-full px-5 py-3 rounded-xl bg-ivy-gradient text-white font-semibold disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate Draft'}
              </button>
            </div>
          </div>

          <div className="card p-6 border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Draft Output</h2>
              <button onClick={copyDraft} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">Copy</button>
            </div>

            {error && <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

            {!result && !isGenerating && !error && (
              <p className="text-sm text-gray-600">Generate a draft to view outline and keyword coverage.</p>
            )}

            {isGenerating && (
              <div className="p-3 border border-primary-200 bg-primary-50 text-primary-700 rounded-lg text-sm">
                Drafting cover letter and alignment outline...
              </div>
            )}

            {result && (
              <>
                <textarea
                  readOnly
                  value={result.draft}
                  className="w-full min-h-[280px] border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Outline</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {result.outline.map((item, index) => (
                        <li key={`${item}-${index}`} className="p-2 border border-gray-200 rounded-lg">{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Keywords Used</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.keywordsUsed.map((keyword) => (
                        <span key={keyword} className="px-2 py-1 text-xs rounded-full border border-primary-200 bg-primary-50 text-primary-700">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
