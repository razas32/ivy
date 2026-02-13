'use client';

import { useState, useEffect } from 'react';
import { Course, CourseColor } from '@/types';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Partial<Course>) => void;
  course?: Course | null;
  mode: 'create' | 'edit';
}

const courseColorValues: Record<CourseColor, string> = {
  blue: '#3b82f6',
  purple: '#a855f7',
  green: '#10b981',
  orange: '#f97316',
  red: '#ef4444',
  pink: '#ec4899',
};

const courseColors: { value: CourseColor; label: string }[] = [
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'green', label: 'Green' },
  { value: 'orange', label: 'Orange' },
  { value: 'red', label: 'Red' },
  { value: 'pink', label: 'Pink' },
];

export default function CourseModal({ isOpen, onClose, onSave, course, mode }: CourseModalProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    color: 'blue' as CourseColor,
    dueDate: '',
  });

  useEffect(() => {
    if (course && mode === 'edit') {
      setFormData({
        code: course.code,
        name: course.name,
        color: course.color,
        dueDate: course.dueDate,
      });
      return;
    }

    setFormData({
      code: '',
      name: '',
      color: 'blue',
      dueDate: '',
    });
  }, [course, mode, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      color: formData.color,
      dueDate: formData.dueDate.trim(),
    };

    if (mode === 'create') {
      onSave({
        ...payload,
        progress: 0,
        tasksCompleted: 0,
        totalTasks: 0,
      });
    } else {
      onSave({
        id: course?.id,
        ...payload,
        progress: course?.progress ?? 0,
        tasksCompleted: course?.tasksCompleted ?? 0,
        totalTasks: course?.totalTasks ?? 0,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/25 backdrop-blur-[1px]">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl modal-animate-in">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? 'Add Course' : 'Edit Course'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {mode === 'create' ? 'Create a course in one step.' : 'Update your course details.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="course-code" className="text-sm font-medium text-gray-700">
              Course Code
            </label>
            <input
              id="course-code"
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="input"
              placeholder="e.g., CS101"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="course-name" className="text-sm font-medium text-gray-700">
              Course Name
            </label>
            <input
              id="course-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Intro to Computer Science"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Color</label>
            <div className="grid grid-cols-6 gap-2">
              {courseColors.map((colorOption) => {
                const selected = formData.color === colorOption.value;
                return (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: colorOption.value })}
                    className={`h-9 rounded-lg border transition-all ${
                      selected
                        ? 'border-gray-900 ring-1 ring-gray-900/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: courseColorValues[colorOption.value] }}
                    aria-pressed={selected}
                    title={colorOption.label}
                  />
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="course-due-date" className="text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              id="course-due-date"
              type="text"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="input"
              placeholder="e.g., Nov 15, 2026"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="btn btn-secondary px-4 py-2.5">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-4 py-2.5">
              {mode === 'create' ? 'Add Course' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
