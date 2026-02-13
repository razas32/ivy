'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import IvyGradient from '@/components/IvyGradient';
import { Course, ResumeAnalysisReport } from '@/types';
import { mockCourses } from '@/lib/mockData';
import { fetchBootstrap, saveCareerAsset } from '@/lib/clientApi';

type AnalysisStep = 'idle' | 'uploading' | 'parsing' | 'scoring' | 'recommendations' | 'done';

export default function ResumeAnalyzer() {
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('idle');
  const [report, setReport] = useState<ResumeAnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAnalyzing = analysisStep !== 'idle' && analysisStep !== 'done';

  const canRun = !!file && !!jobDescription.trim() && !isAnalyzing;

  useEffect(() => {
    const run = async () => {
      try {
        const data = await fetchBootstrap();
        setCourses(data.courses);
      } catch (_error) {}
    };

    run();
  }, []);

  const stepLabel = useMemo(() => {
    if (analysisStep === 'uploading') return 'Uploading resume...';
    if (analysisStep === 'parsing') return 'Parsing PDF text...';
    if (analysisStep === 'scoring') return 'Scoring match and extracting keywords...';
    if (analysisStep === 'recommendations') return 'Generating prioritized edits...';
    return '';
  }, [analysisStep]);

  const runAnalysis = async () => {
    if (!file || !jobDescription.trim()) return;

    setError(null);
    setReport(null);

    try {
      setAnalysisStep('uploading');

      const formData = new FormData();
      formData.set('file', file);
      formData.set('jobDescription', jobDescription);

      setAnalysisStep('parsing');

      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        body: formData,
      });

      setAnalysisStep('scoring');

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to analyze resume.');
      }

      setAnalysisStep('recommendations');

      const nextReport: ResumeAnalysisReport = {
        matchScore: data.matchScore,
        matchedKeywords: data.matchedKeywords || [],
        missingKeywords: data.missingKeywords || [],
        seniorityCues: data.seniorityCues || [],
        recommendations: data.recommendations || [],
        extractedResumePreview: data.extractedResumePreview || '',
      };

      setReport(nextReport);

      await saveCareerAsset({
        type: 'resume_report',
        title: `Resume Report ${new Date().toLocaleString()}`,
        content: nextReport,
      });

      setAnalysisStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
      setAnalysisStep('idle');
    }
  };

  const reset = () => {
    setFile(null);
    setJobDescription('');
    setAnalysisStep('idle');
    setReport(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-white to-surface-100">
      <Sidebar courses={courses} />

      <main className="ml-64 pb-20">
        <div className="max-w-7xl mx-auto px-8 py-10 space-y-8">
          <IvyGradient className="rounded-3xl p-8 text-white border border-primary-500/30">
            <h1 className="text-3xl font-bold !text-white">Resume Analyzer</h1>
            <p className="text-white/90 mt-2">Upload PDF + job description for ATS match score and specific edits.</p>
          </IvyGradient>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="card p-7 space-y-4 border border-gray-200/80">
              <h2 className="text-xl font-semibold text-gray-900">Inputs</h2>

              <div className="space-y-2">
                <label htmlFor="resume-file" className="text-sm text-gray-700 font-medium">Resume (PDF only)</label>
                <input
                  id="resume-file"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                {file && <p className="text-xs text-gray-600">Selected: {file.name}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="job-description" className="text-sm text-gray-700 font-medium">Job Description</label>
                <textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste full posting including responsibilities and requirements"
                  className="w-full min-h-[220px] border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={runAnalysis}
                  disabled={!canRun}
                  className="px-5 py-3 rounded-xl bg-ivy-gradient text-white font-semibold disabled:opacity-50"
                >
                  Run Analysis
                </button>
                <button onClick={reset} className="px-5 py-3 rounded-xl border border-gray-300 font-semibold text-gray-700">
                  Reset
                </button>
              </div>
            </div>

            <div className="card p-7 space-y-4 border border-gray-200/80">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Report</h2>
                {report && (
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(report, null, 2))}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  >
                    Copy JSON
                  </button>
                )}
              </div>

              {isAnalyzing && (
                <div className="p-4 rounded-lg border border-primary-200 bg-primary-50 text-primary-700 text-sm font-medium">
                  {stepLabel}
                </div>
              )}

              {error && (
                <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
              )}

              {!report && !isAnalyzing && !error && (
                <p className="text-gray-600 text-sm">Run analysis to see match score, missing keywords, and recommended edits.</p>
              )}

              {report && (
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg bg-surface-50">
                    <p className="text-sm text-gray-600">Match Score</p>
                    <p className="text-3xl font-bold text-gray-900">{report.matchScore}%</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-900">Top Missing Keywords</h3>
                      <button
                        onClick={() => navigator.clipboard.writeText(report.missingKeywords.join(', '))}
                        className="text-xs px-2 py-1 border border-gray-300 rounded"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {report.missingKeywords.map((keyword) => (
                        <span key={keyword} className="px-2 py-1 text-xs rounded-full bg-red-50 border border-red-200 text-red-700">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Prioritized Edits</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {report.recommendations.map((item, idx) => (
                        <li key={`${item}-${idx}`} className="p-3 rounded-lg border border-gray-200 bg-white">{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Extracted Resume Preview (first 1,000 chars)</h3>
                    <textarea
                      readOnly
                      value={report.extractedResumePreview}
                      className="w-full min-h-[140px] border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-surface-50"
                    />
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
