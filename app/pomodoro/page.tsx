'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Course } from '@/types';
import { mockCourses } from '@/lib/mockData';
import { fetchBootstrap } from '@/lib/clientApi';

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

interface PomodoroSettings {
  pomodoro: number; // minutes
  shortBreak: number;
  longBreak: number;
  sessionsUntilLongBreak: number;
}

export default function PomodoroPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [settings, setSettings] = useState<PomodoroSettings>({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4,
  });

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const data = await fetchBootstrap();
        setCourses(data.courses);
      } catch (_error) {}
    };

    run();
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);

    // Play notification sound (optional)
    if (typeof window !== 'undefined') {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {}); // Gracefully handle if audio fails
    }

    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Timer', {
        body: mode === 'pomodoro' ? 'Time for a break!' : 'Break over! Time to focus.',
        icon: '/icon.png'
      });
    }

    // Auto-switch to next mode
    if (mode === 'pomodoro') {
      const newSessions = sessions + 1;
      setSessions(newSessions);

      if (newSessions % settings.sessionsUntilLongBreak === 0) {
        switchMode('longBreak');
      } else {
        switchMode('shortBreak');
      }
    } else {
      switchMode('pomodoro');
    }
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);

    const durations = {
      pomodoro: settings.pomodoro * 60,
      shortBreak: settings.shortBreak * 60,
      longBreak: settings.longBreak * 60,
    };

    setTimeLeft(durations[newMode]);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    const durations = {
      pomodoro: settings.pomodoro * 60,
      shortBreak: settings.shortBreak * 60,
      longBreak: settings.longBreak * 60,
    };
    setTimeLeft(durations[mode]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = () => {
    const totalTime = mode === 'pomodoro'
      ? settings.pomodoro * 60
      : mode === 'shortBreak'
      ? settings.shortBreak * 60
      : settings.longBreak * 60;

    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const getModeColor = () => {
    switch (mode) {
      case 'pomodoro':
        return 'from-red-500 to-orange-500';
      case 'shortBreak':
        return 'from-blue-500 to-cyan-500';
      case 'longBreak':
        return 'from-purple-500 to-pink-500';
    }
  };

  const getModeTextColor = () => {
    switch (mode) {
      case 'pomodoro':
        return 'text-red-600';
      case 'shortBreak':
        return 'text-blue-600';
      case 'longBreak':
        return 'text-purple-600';
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar courses={courses} />

      <main className="ml-64">
        <div className="max-w-4xl mx-auto p-8">
          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Dashboard</span>
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Pomodoro Timer</h1>
            <p className="text-gray-600">Stay focused with the Pomodoro Technique</p>
          </div>

          {/* Mode Switcher */}
          <div className="flex gap-3 justify-center mb-8">
            <button
              onClick={() => switchMode('pomodoro')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                mode === 'pomodoro'
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Pomodoro
            </button>
            <button
              onClick={() => switchMode('shortBreak')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                mode === 'shortBreak'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Short Break
            </button>
            <button
              onClick={() => switchMode('longBreak')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                mode === 'longBreak'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Long Break
            </button>
          </div>

          {/* Timer Card */}
          <div className="card p-12 mb-8">
            {/* Circular Progress */}
            <div className="relative w-80 h-80 mx-auto mb-8">
              {/* Background Circle */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="160"
                  cy="160"
                  r="140"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                {/* Progress Circle */}
                <circle
                  cx="160"
                  cy="160"
                  r="140"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 140}`}
                  strokeDashoffset={`${2 * Math.PI * 140 * (1 - progress() / 100)}`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" className={mode === 'pomodoro' ? 'text-red-500' : mode === 'shortBreak' ? 'text-blue-500' : 'text-purple-500'} stopColor="currentColor" />
                    <stop offset="100%" className={mode === 'pomodoro' ? 'text-orange-500' : mode === 'shortBreak' ? 'text-cyan-500' : 'text-pink-500'} stopColor="currentColor" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Time Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-7xl font-bold ${getModeTextColor()} mb-2`}>
                  {formatTime(timeLeft)}
                </div>
                <div className="text-gray-500 text-lg capitalize">{mode.replace(/([A-Z])/g, ' $1').trim()}</div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={toggleTimer}
                className={`px-8 py-4 rounded-xl font-semibold text-white shadow-lg transition-all hover:scale-105 bg-gradient-to-r ${getModeColor()}`}
              >
                {isRunning ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={resetTimer}
                className="px-8 py-4 rounded-xl font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="card p-6 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">{sessions}</div>
              <div className="text-sm text-gray-600">Sessions Completed</div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {Math.floor((sessions * settings.pomodoro) / 60)}h {(sessions * settings.pomodoro) % 60}m
              </div>
              <div className="text-sm text-gray-600">Total Focus Time</div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {sessions % settings.sessionsUntilLongBreak}
              </div>
              <div className="text-sm text-gray-600">Until Long Break</div>
            </div>
          </div>

          {/* Settings */}
          <div className="card p-6">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center justify-between"
            >
              <span className="font-semibold text-gray-900">Settings</span>
              <svg
                className={`w-5 h-5 transition-transform ${showSettings ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showSettings && (
              <div className="mt-6 grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pomodoro Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.pomodoro}
                    onChange={(e) => setSettings({...settings, pomodoro: parseInt(e.target.value) || 25})}
                    className="input"
                    min="1"
                    max="60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Break (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.shortBreak}
                    onChange={(e) => setSettings({...settings, shortBreak: parseInt(e.target.value) || 5})}
                    className="input"
                    min="1"
                    max="30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Long Break (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.longBreak}
                    onChange={(e) => setSettings({...settings, longBreak: parseInt(e.target.value) || 15})}
                    className="input"
                    min="1"
                    max="60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sessions Until Long Break
                  </label>
                  <input
                    type="number"
                    value={settings.sessionsUntilLongBreak}
                    onChange={(e) => setSettings({...settings, sessionsUntilLongBreak: parseInt(e.target.value) || 4})}
                    className="input"
                    min="2"
                    max="10"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
