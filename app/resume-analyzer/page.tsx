'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import IvyGradient from '@/components/IvyGradient';
import { Course } from '@/types';
import { loadFromStorage, STORAGE_KEYS } from '@/lib/storage';
import { mockCourses } from '@/lib/mockData';

export default function ResumeAnalyzer() {
  const [courses] = useState<Course[]>(() => loadFromStorage<Course[]>(STORAGE_KEYS.courses, mockCourses));
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isResumeDragging, setIsResumeDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const uploadedFile = e.target.files[0];
      if (uploadedFile.type === 'application/pdf' || uploadedFile.name.endsWith('.pdf')) {
        setFile(uploadedFile);
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target || !isResumeDragging) {
      setIsResumeDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setIsResumeDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResumeDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const droppedFile = files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf')) {
        setFile(droppedFile);
      }
    }
  };

  const handleCompare = async () => {
    if (!file || !jobDescription.trim()) return;

    setIsAnalyzing(true);
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasAnalyzed(true);
    }, 2000);
  };

  const handleReset = () => {
    setFile(null);
    setJobDescription('');
    setHasAnalyzed(false);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-surface-100">
      <Sidebar courses={courses} />

      <main className="ml-64 pb-20">
        <div className="max-w-7xl mx-auto p-8 space-y-8">
          {/* Hero */}
          <IvyGradient className="relative overflow-hidden rounded-3xl text-white shadow-xl border border-primary-500/30">
            <div className="relative p-8 lg:p-10 flex flex-wrap items-start justify-between gap-8">
              <div className="space-y-3 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-md border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  Ivy Career Lab
                </div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold leading-tight text-white">Resume Analyzer</h1>
                  <span className="hidden md:inline text-sm px-3 py-1 rounded-full bg-white/15 text-white border border-white/20 font-semibold backdrop-blur-md">ATS-ready</span>
                </div>
                <p className="text-white/90 max-w-2xl">
                  Upload your resume and the job post to get clear, prioritized next steps.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <span className="px-3 py-1 rounded-full bg-white/15 border border-white/25 text-sm font-medium text-white backdrop-blur-md">Client-side preview</span>
                  <span className="px-3 py-1 rounded-full bg-white/15 border border-white/25 text-sm font-medium text-white backdrop-blur-md">Built for Ivy students</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 min-w-[240px]">
                {[
                  { label: 'Avg. Match Uplift', value: '+12%' },
                  { label: 'Keywords Found', value: '42' },
                  { label: 'Turnaround', value: 'Under 10s' },
                  { label: 'Privacy', value: 'Local only' },
                ].map((metric) => (
                  <div key={metric.label} className="bg-white/15 border border-white/25 rounded-xl px-4 py-3 shadow-sm backdrop-blur-md">
                    <p className="text-xs text-white/80">{metric.label}</p>
                    <p className="text-lg font-semibold text-white">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </IvyGradient>

          <div className="grid grid-cols-1 xl:grid-cols-[1.05fr,1.25fr] gap-6 items-start">
            {/* Input Column */}
            <div className="space-y-5">
              {/* Resume Upload */}
              <div
                className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm p-6"
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary-50/40 via-white to-white opacity-70" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary-100 p-2 rounded-lg">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Resume Upload</h2>
                        <p className="text-sm text-gray-600">PDF only · drag & drop or browse</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                      Secure & private
                    </span>
                  </div>

                  {isResumeDragging && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm border-2 border-dashed border-primary-500 rounded-2xl flex items-center justify-center z-20">
                      <div className="text-center space-y-2">
                        <svg className="w-10 h-10 text-primary-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="font-semibold text-primary-700">Drop to upload</p>
                      </div>
                    </div>
                  )}

                <div className="relative border border-dashed border-gray-200 rounded-xl p-5 bg-white">
                  {!file ? (
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="p-3 rounded-full bg-primary-50">
                          <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-700 font-medium">Drag your resume here or</p>
                        <div className="flex items-center gap-2">
                          <input type="file" id="resume-upload" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                          <label
                            htmlFor="resume-upload"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-900 hover:border-primary-300 hover:text-primary-700 cursor-pointer transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Browse PDF
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">Max 10MB · concise bullets</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-primary-50">
                            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">Ready to analyze</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setFile(null)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Job Description</h2>
                      <p className="text-sm text-gray-600">Include scope, requirements, tech stack</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{jobDescription.length ? `${jobDescription.length} chars` : 'More detail = better fit'}</span>
                </div>
                <textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full posting... e.g. scope, must-haves, tech stack, team size, outcomes."
                  className="w-full min-h-[220px] px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-surface-50"
                />
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 rounded-full bg-gray-100 border border-gray-200">Tip: mirror the exact keywords</span>
                  <span className="px-2 py-1 rounded-full bg-gray-100 border border-gray-200">Keep bullet lists intact</span>
                </div>
              </div>

              {/* Actions */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary-500" />
                  <p className="text-sm text-gray-800 font-semibold">Run analysis</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-surface-50 border border-gray-200">
                    <p className="text-xs text-gray-500">Step 1</p>
                    <p className="text-sm font-semibold text-gray-800">Upload PDF resume</p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-50 border border-gray-200">
                    <p className="text-xs text-gray-500">Step 2</p>
                    <p className="text-sm font-semibold text-gray-800">Paste job description</p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-50 border border-gray-200">
                    <p className="text-xs text-gray-500">Step 3</p>
                    <p className="text-sm font-semibold text-gray-800">Generate tailored insights</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleCompare}
                    disabled={!file || !jobDescription.trim() || isAnalyzing}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg shadow-primary-500/20 bg-ivy-gradient transition-all duration-200 hover:shadow-primary-600/30 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Run Analysis
                      </>
                    )}
                  </button>
                  <span className="text-sm text-gray-600">No data leaves your browser in this demo.</span>
                </div>
              </div>
            </div>

            {/* Results Column */}
            <div className="rounded-3xl border border-gray-200 bg-white shadow-lg p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Report</p>
                    <h2 className="text-2xl font-bold text-gray-900">Report</h2>
                    <p className="text-sm text-gray-600">ATS-friendly, student-focused insights for this posting.</p>
                </div>
                {(hasAnalyzed || isAnalyzing) && (
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 bg-white hover:border-gray-300 transition-colors font-medium shadow-sm"
                  >
                    New Analysis
                  </button>
                )}
              </div>

              {/* States */}
              {isAnalyzing ? (
                <div className="min-h-[320px] flex flex-col items-center justify-center gap-3 bg-surface-50 border border-dashed border-primary-200 rounded-2xl">
                  <svg className="animate-spin w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm font-semibold text-gray-800">Generating your tailored findings...</p>
                  <p className="text-xs text-gray-500">Parsing keywords, weighting impact, and scoring alignment.</p>
                </div>
              ) : !hasAnalyzed ? (
                <div className="min-h-[320px] rounded-2xl border border-dashed border-gray-200 bg-surface-50 p-8 flex flex-col justify-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary-50">
                      <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Ready when you are</p>
                      <p className="text-sm text-gray-600">Upload your resume and paste the job description to see your report.</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white border border-gray-200">
                      <p className="text-xs text-gray-500">What you get</p>
                      <p className="text-sm font-semibold text-gray-800">Match scores, strengths, gaps</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-gray-200">
                      <p className="text-xs text-gray-500">Why it helps</p>
                      <p className="text-sm font-semibold text-gray-800">Faster tailoring for applications</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">Built for Ivy students: crisp guidance without fluff.</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Banner */}
                  <div className="rounded-2xl overflow-hidden border border-primary-100 bg-gradient-to-r from-primary-50 via-white to-white">
                    <div className="px-5 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-primary-700">Overall fit</p>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-900">78% aligned</span>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 border border-primary-200">High potential</span>
                        </div>
                        <p className="text-sm text-gray-600">Close fit—fill gaps to reach the 80s.</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-3 text-sm text-gray-700">
                        <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-gray-200 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          ATS keywords 85%
                        </div>
                        <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-gray-200 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                          Skills depth 75%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scores */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Overall Match', value: '78%' },
                      { label: 'Skills Match', value: '82%' },
                      { label: 'Experience Match', value: '75%' },
                      { label: 'Keyword Match', value: '85%' },
                    ].map((score) => (
                      <div key={score.label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="text-3xl font-bold text-gray-900">{score.value}</div>
                        <p className="text-sm text-gray-600">{score.label}</p>
                        <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600" style={{ width: score.value }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Skills */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Matching Skills</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['Python', 'React', 'JavaScript', 'AWS', 'SQL', 'Node.js', 'Git', 'Docker'].map((skill) => (
                          <span key={skill} className="px-3 py-1.5 rounded-full text-sm font-medium bg-green-50 text-green-800 border border-green-100">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Gaps to Address</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['Kubernetes', 'TypeScript', 'GraphQL', 'CI/CD', 'Microservices'].map((skill) => (
                          <span key={skill} className="px-3 py-1.5 rounded-full text-sm font-medium bg-orange-50 text-orange-800 border border-orange-100">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Improvements */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      <h3 className="text-sm font-semibold text-gray-900">Strengths</h3>
                      </div>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 mt-1" />
                          Strong alignment with Python, React, AWS, SQL stack.
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 mt-1" />
                          Clear leadership and collaboration signals across roles.
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 mt-1" />
                          Quantified wins already present—keep the pattern.
                        </li>
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                      <h3 className="text-sm font-semibold text-gray-900">Fix next</h3>
                      </div>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-500 mt-1" />
                          Add Kubernetes + TypeScript to skills; cite where used.
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-500 mt-1" />
                          Call out microservices + CI/CD ownership with metrics.
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-500 mt-1" />
                          Mirror top keywords in your summary and first bullets.
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Keywords */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900">Keyword coverage</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Full-Stack Development', value: '100%' },
                        { label: 'Cloud Architecture', value: '80%' },
                        { label: 'Team Leadership', value: '90%' },
                        { label: 'Agile Methodology', value: '60%' },
                        { label: 'API Design', value: '40%' },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between text-xs mb-1 text-gray-600">
                            <span className="font-medium text-gray-800">{item.label}</span>
                            <span className="text-primary-700 font-semibold">{item.value}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600" style={{ width: item.value }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 justify-end">
                    <button className="px-5 py-2.5 rounded-xl font-semibold text-white bg-ivy-gradient shadow-md shadow-primary-500/25 hover:shadow-primary-600/30">
                      Download PDF Report
                    </button>
                    <button className="px-5 py-2.5 rounded-xl font-semibold text-gray-800 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm">
                      Copy suggestions
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
