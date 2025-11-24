'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import IvyGradient from '@/components/IvyGradient';
import { Course } from '@/types';
import { loadFromStorage, STORAGE_KEYS } from '@/lib/storage';
import { mockCourses } from '@/lib/mockData';

const sampleCoverLetter = `Dear Hiring Manager,

I am excited to apply for the Senior Software Engineer role at Acme Corp. With 6+ years building customer-facing products, I have led teams shipping React/TypeScript frontends, designed scalable Node.js APIs, and delivered cloud-native services on AWS. In my current role, I improved deployment reliability by 35% by introducing CI/CD automation and containerized microservices.

Your emphasis on cross-functional collaboration, mentorship, and measurable impact aligns with my experience partnering with product and design to deliver outcomes, not just features. I am particularly drawn to the opportunity to modernize your platform and coach engineers as you scale.

Thank you for your consideration—I would welcome the chance to discuss how I can contribute.

Sincerely,
Jordan Rivera`;

export default function CoverLetterGenerator() {
  const [courses] = useState<Course[]>(() => loadFromStorage<Course[]>(STORAGE_KEYS.courses, mockCourses));
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [customPrompt, setCustomPrompt] = useState('Use a confident, concise tone. Highlight leadership, impact, and alignment with the role.');
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [isDraggingResume, setIsDraggingResume] = useState(false);

  const handleGenerate = () => {
    if (!jobDescription.trim() || !resumeText.trim()) return;

    setIsGenerating(true);
    setGeneratedLetter('');

    // Simulate AI generation for now
    setTimeout(() => {
      setGeneratedLetter(sampleCoverLetter);
      setIsGenerating(false);
    }, 1200);
  };

  const handleResumeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingResume(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setResumeFileName(file.name);
    }
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFileName(file.name);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-surface-100">
      <Sidebar courses={courses} />

      <main className="ml-64 pb-24">
        <div className="max-w-7xl mx-auto p-8 space-y-8">
          {/* Hero */}
          <IvyGradient className="relative overflow-hidden rounded-3xl text-white shadow-xl border border-primary-500/30">
            <div className="relative p-8 lg:p-10 flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-md border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    Ivy Career Lab
                  </div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold leading-tight text-white">Cover Letter Generator</h1>
                    <span className="hidden md:inline text-sm px-3 py-1 rounded-full bg-white/15 text-white border border-white/20 font-semibold backdrop-blur-md">ATS-ready</span>
                  </div>
                <p className="text-white/90 max-w-3xl">
                  Drop in the job post and your resume highlights to ship a polished draft fast.
                </p>
                </div>
                <div className="px-4 py-2 rounded-lg bg-white/15 border border-white/25 text-sm font-semibold backdrop-blur-md">
                  Frontend preview · AI stubbed
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Draft time', value: '<10s' },
                  { label: 'Tone presets', value: '5' },
                  { label: 'Privacy', value: 'Local only' },
                  { label: 'Status', value: 'Preview' },
                ].map((metric) => (
                  <div key={metric.label} className="bg-white/15 border border-white/25 rounded-xl px-4 py-3 shadow-sm backdrop-blur-md">
                    <p className="text-xs text-white/80">{metric.label}</p>
                    <p className="text-lg font-semibold text-white">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </IvyGradient>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Job Description */}
            <div className="card p-6 xl:col-span-2 flex flex-col border border-gray-200 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Job Description</h2>
                  <p className="text-sm text-gray-600">Paste the full posting for best alignment</p>
                </div>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste responsibilities, requirements, and company context..."
                className="flex-1 min-h-[220px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
              <div className="text-xs text-gray-500 mt-2">{jobDescription ? `${jobDescription.length} characters` : 'Include the full job post to capture tone and keywords.'}</div>
            </div>

            {/* Resume + Prompt */}
            <div className="card p-6 space-y-4 border border-gray-200 rounded-2xl shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Resume Highlights</h2>
                    <p className="text-sm text-gray-600">Paste bullets or attach your PDF</p>
                </div>
              </div>
              <div
                  className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${isDraggingResume ? 'border-primary-400 bg-primary-50' : 'border-gray-200 bg-gray-50'}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingResume(true);
                }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDraggingResume(false);
                  }}
                  onDrop={handleResumeDrop}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 font-medium">Drop PDF resume or click to attach</p>
                      <p className="text-xs text-gray-500 mb-3">Client-side only for this preview.</p>
                      <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-100">
                        <input type="file" className="hidden" accept=".pdf" onChange={handleResumeUpload} />
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload PDF
                      </label>
                      {resumeFileName && <p className="text-xs text-green-600 mt-2">Attached: {resumeFileName}</p>}
                    </div>
                  </div>
                </div>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste a short summary plus 4-6 impact bullets with metrics..."
                  className="mt-3 w-full min-h-[160px] px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Custom Prompt (optional)</h3>
                    <p className="text-xs text-gray-500">Guide tone, structure, or emphasis.</p>
                  </div>
                </div>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full min-h-[90px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={!jobDescription.trim() || !resumeText.trim() || isGenerating}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg shadow-primary-500/20 bg-ivy-gradient transition-all duration-200 hover:shadow-primary-600/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating cover letter...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Generate Cover Letter
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Output */}
            <div className="card p-6 xl:col-span-2 flex flex-col border border-gray-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Cover Letter</h2>
                    <p className="text-sm text-gray-600">Preview and refine</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Copy</button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Download</button>
                </div>
              </div>
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-line min-h-[260px]">
                {generatedLetter || (isGenerating ? 'Drafting your cover letter...' : 'Your generated cover letter will appear here.')}
              </div>
            </div>

            {/* Guidance */}
            <div className="space-y-4">
              <div className="card p-5 border border-gray-200 rounded-2xl shadow-sm">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Quick Tips</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>Mirror top keywords from the post naturally.</li>
                      <li>Lead with 1-2 quantified wins.</li>
                      <li>Map 2-3 requirements to specific achievements.</li>
                      <li>Keep to 3-4 short paragraphs.</li>
                    </ul>
                  </div>

                  <div className="card p-5 border border-gray-200 rounded-2xl shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Personalization Prompts</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="px-3 py-2 bg-primary-50 border border-primary-100 rounded-lg">
                    Emphasize mentoring junior engineers and leading cross-team projects.
                  </p>
                  <p className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                    Highlight experience with cloud migrations and reliability improvements.
                  </p>
                  <p className="px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg">
                    Match the company voice: energetic, user-obsessed, and pragmatic.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
