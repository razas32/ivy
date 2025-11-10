'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
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
    <div className="min-h-screen bg-surface-50">
      <Sidebar courses={courses} />

      <main className="ml-64 pb-24">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary-600 mb-2">Resume Analyzer</h1>
            <p className="text-gray-600">Upload your resume and paste the job description to get AI-powered matching insights</p>
          </div>

          {/* Upload Section - Side by Side */}
          {!hasAnalyzed ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Resume Upload */}
                <div
                  className="card p-6 relative min-h-[400px] flex flex-col"
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {/* Drag Overlay */}
                  {isResumeDragging && (
                    <div className="absolute inset-0 bg-primary-50 bg-opacity-95 border-4 border-dashed border-primary-500 rounded-2xl flex items-center justify-center z-50 pointer-events-none">
                      <div className="text-center">
                        <svg className="w-12 h-12 text-primary-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-lg font-semibold text-primary-700">Drop your resume here</p>
                        <p className="text-sm text-primary-600 mt-1">PDF format only</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Resume Upload</h2>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    {!file ? (
                      <>
                        <div className="bg-primary-50 p-6 rounded-full mb-4">
                          <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-gray-700 font-medium mb-4">
                          Drag and drop your resume here
                        </p>
                        <p className="text-sm text-gray-500 mb-6">or</p>

                        <input
                          type="file"
                          id="resume-upload"
                          className="hidden"
                          accept=".pdf"
                          onChange={handleFileUpload}
                        />
                        <label
                          htmlFor="resume-upload"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Browse Files
                        </label>

                        <p className="text-xs text-gray-500 mt-4">PDF format only (Max 10MB)</p>
                      </>
                    ) : (
                      <>
                        <div className="bg-green-50 p-6 rounded-full mb-4">
                          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>

                        <p className="text-gray-700 font-semibold mb-4">Resume Uploaded</p>

                        <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg mb-4 max-w-sm">
                          <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-900 flex-1 text-left truncate">{file.name}</span>
                          <button
                            onClick={() => setFile(null)}
                            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <p className="text-sm text-green-600">✓ Ready to compare</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Job Description Input */}
                <div className="card p-6 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Job Description</h2>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <label htmlFor="job-description" className="text-sm font-medium text-gray-700 mb-2">
                      Paste the job posting details
                    </label>
                    <textarea
                      id="job-description"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the full job description here, including requirements, responsibilities, and qualifications..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none min-h-[300px]"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {jobDescription.length > 0 ? `${jobDescription.length} characters` : 'Include as much detail as possible for better matching'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Compare Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleCompare}
                  disabled={!file || !jobDescription.trim() || isAnalyzing}
                  className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing Match...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Compare & Analyze
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Analysis Results */
            <div className="space-y-6">
              {/* AI Findings Section */}
              <div className="card p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-100 p-3 rounded-xl">
                      <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">AI Findings</h2>
                      <p className="text-sm text-gray-600">Recommendations based on job description analysis and best practices</p>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    New Analysis
                  </button>
                </div>

                {/* Key Recommendations */}
                <div className="space-y-4">
                  <div className="p-4 bg-primary-50 border-l-4 border-primary-600 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">Add Missing Technical Skills</h4>
                        <p className="text-sm text-gray-700 mb-2">The job description emphasizes <strong>Kubernetes, TypeScript, and GraphQL</strong>, but these are not mentioned in your resume. Consider adding these if you have experience, or highlight transferable skills.</p>
                        <p className="text-xs text-gray-600 italic">Best Practice: Include relevant technologies from the job posting to improve ATS matching (85% of resumes are filtered by ATS before human review).</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">Strengthen Your Professional Summary</h4>
                        <p className="text-sm text-gray-700 mb-2">Mirror the job description's language by emphasizing <strong>full-stack development, cloud architecture, and team leadership</strong> in your opening summary. These keywords appear frequently in the posting.</p>
                        <p className="text-xs text-gray-600 italic">Best Practice: Place the most relevant keywords in the first third of your resume, as recruiters spend an average of 7.4 seconds on initial screening.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 border-l-4 border-purple-600 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">Quantify Your Impact with Metrics</h4>
                        <p className="text-sm text-gray-700 mb-2">Add specific numbers to your achievements. For example: "Led team of X developers" or "Improved system performance by X%". The job description emphasizes measurable results.</p>
                        <p className="text-xs text-gray-600 italic">Best Practice: Resumes with quantified achievements are 40% more likely to receive interview requests.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 border-l-4 border-orange-600 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">Highlight CI/CD and DevOps Experience</h4>
                        <p className="text-sm text-gray-700 mb-2">The job posting mentions CI/CD pipelines and microservices architecture multiple times. Expand on your experience with deployment automation, containerization, and infrastructure management.</p>
                        <p className="text-xs text-gray-600 italic">Best Practice: Match the depth of detail to the job requirements - if it's mentioned multiple times, dedicate more space to it.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border-l-4 border-green-600 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">Strong Foundation - Keep These Elements</h4>
                        <p className="text-sm text-gray-700 mb-2">Your experience with <strong>Python, React, AWS, and SQL</strong> aligns perfectly with the job requirements. Your clean formatting and organized structure are excellent - maintain these strengths.</p>
                        <p className="text-xs text-gray-600 italic">Best Practice: Build on what's already working. You have an 82% skills match and 85% keyword match.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Analysis Section Header */}
              <div className="pt-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Detailed Analysis</h3>
                <p className="text-gray-600 mb-6">In-depth breakdown of your resume's compatibility with the job description</p>
              </div>

              {/* Overall Match Score Card */}
              <div className="card p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Match Scores</h2>
                    <p className="text-sm text-gray-600">Quantitative assessment across key dimensions</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Overall Match */}
                  <div className="text-center p-6 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl text-white">
                    <div className="text-5xl font-bold mb-2">78%</div>
                    <div className="text-sm font-medium opacity-90">Overall Match</div>
                  </div>

                  {/* Skills Match */}
                  <div className="text-center p-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl text-white">
                    <div className="text-5xl font-bold mb-2">82%</div>
                    <div className="text-sm font-medium opacity-90">Skills Match</div>
                  </div>

                  {/* Experience Match */}
                  <div className="text-center p-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl text-white">
                    <div className="text-5xl font-bold mb-2">75%</div>
                    <div className="text-sm font-medium opacity-90">Experience Match</div>
                  </div>

                  {/* Keyword Match */}
                  <div className="text-center p-6 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl text-white">
                    <div className="text-5xl font-bold mb-2">85%</div>
                    <div className="text-sm font-medium opacity-90">Keyword Match</div>
                  </div>
                </div>
              </div>

              {/* Matching Skills & Missing Skills */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Matching Skills */}
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Matching Skills</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Skills found in both your resume and job description</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-200">Python</span>
                    <span className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-200">React</span>
                    <span className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-200">JavaScript</span>
                    <span className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-200">AWS</span>
                    <span className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-200">SQL</span>
                    <span className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-200">Node.js</span>
                    <span className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-200">Git</span>
                    <span className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-200">Docker</span>
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Missing Skills</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Skills requested in the job description not found in your resume</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-orange-50 text-orange-700 text-sm font-medium rounded-lg border border-orange-200">Kubernetes</span>
                    <span className="px-3 py-1.5 bg-orange-50 text-orange-700 text-sm font-medium rounded-lg border border-orange-200">TypeScript</span>
                    <span className="px-3 py-1.5 bg-orange-50 text-orange-700 text-sm font-medium rounded-lg border border-orange-200">GraphQL</span>
                    <span className="px-3 py-1.5 bg-orange-50 text-orange-700 text-sm font-medium rounded-lg border border-orange-200">CI/CD</span>
                    <span className="px-3 py-1.5 bg-orange-50 text-orange-700 text-sm font-medium rounded-lg border border-orange-200">Microservices</span>
                  </div>
                </div>
              </div>

              {/* Key Strengths & Recommended Improvements */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Key Strengths */}
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Key Strengths</h3>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Strong technical skills alignment with required technologies</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Relevant industry experience matches job requirements</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Quantifiable achievements demonstrate impact</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Clear demonstration of leadership and collaboration</span>
                    </li>
                  </ul>
                </div>

                {/* Recommended Improvements */}
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Recommended Improvements</h3>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Add Kubernetes and TypeScript to your skills section</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Highlight experience with microservices architecture</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Include more keywords from the job description naturally</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Emphasize CI/CD pipeline experience in project descriptions</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Detailed Keyword Analysis */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Keyword Frequency Analysis</h3>
                </div>
                <p className="text-sm text-gray-600 mb-6">Top keywords from job description and their presence in your resume</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700 font-medium">Full-Stack Development</span>
                      <span className="text-primary-600 font-semibold">5 mentions</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700 font-medium">Cloud Architecture</span>
                      <span className="text-blue-600 font-semibold">3 mentions</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700 font-medium">Team Leadership</span>
                      <span className="text-purple-600 font-semibold">4 mentions</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700 font-medium">Agile Methodology</span>
                      <span className="text-orange-600 font-semibold">2 mentions</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700 font-medium">API Design</span>
                      <span className="text-red-600 font-semibold">1 mention</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <button className="px-6 py-3 bg-primary-100 text-primary-800 rounded-xl font-semibold hover:bg-primary-200 transition-colors shadow-lg hover:shadow-xl border-2 border-primary-300">
                  Download Full Report
                </button>
                <button className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-900 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                  Optimize Resume
                </button>
              </div>
            </div>
          )}

          {/* Info Cards - Always Visible */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 text-center">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Matching</h3>
              <p className="text-sm text-gray-600">Get instant compatibility scores using advanced NLP technology</p>
            </div>

            <div className="card p-6 text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Actionable Insights</h3>
              <p className="text-sm text-gray-600">Get specific recommendations to improve your resume</p>
            </div>

            <div className="card p-6 text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Private & Secure</h3>
              <p className="text-sm text-gray-600">Your data is encrypted and never stored permanently</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
