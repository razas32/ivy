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

const courseColors: { value: CourseColor; label: string; class: string }[] = [
  { value: 'blue', label: 'Blue', class: 'bg-course-blue' },
  { value: 'purple', label: 'Purple', class: 'bg-course-purple' },
  { value: 'green', label: 'Green', class: 'bg-course-green' },
  { value: 'orange', label: 'Orange', class: 'bg-course-orange' },
  { value: 'red', label: 'Red', class: 'bg-course-red' },
  { value: 'pink', label: 'Pink', class: 'bg-course-pink' },
];

export default function CourseModal({ isOpen, onClose, onSave, course, mode }: CourseModalProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    color: 'blue' as CourseColor,
    totalTasks: 1,
    dueDate: '',
  });

  useEffect(() => {
    if (course && mode === 'edit') {
      setFormData({
        code: course.code,
        name: course.name,
        color: course.color,
        totalTasks: course.totalTasks,
        dueDate: course.dueDate,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        color: 'blue',
        totalTasks: 1,
        dueDate: '',
      });
    }
  }, [course, mode, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'create') {
      onSave({
        ...formData,
        progress: 0,
        tasksCompleted: 0,
      });
    } else {
      onSave({
        id: course?.id,
        ...formData,
        progress: course?.progress || 0,
        tasksCompleted: course?.tasksCompleted || 0,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Add New Course' : 'Edit Course'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Course Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Code
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="input"
              placeholder="e.g., CS101"
              required
            />
          </div>

          {/* Course Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Introduction to Computer Science"
              required
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Theme
            </label>
            <div className="grid grid-cols-6 gap-2">
              {courseColors.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: colorOption.value })}
                  className={`${colorOption.class} h-10 rounded-lg transition-all ${
                    formData.color === colorOption.value
                      ? 'ring-2 ring-offset-2 ring-gray-900'
                      : 'hover:scale-110'
                  }`}
                  title={colorOption.label}
                />
              ))}
            </div>
          </div>

          {/* Total Tasks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Tasks
            </label>
            <input
              type="number"
              value={formData.totalTasks}
              onChange={(e) => setFormData({ ...formData, totalTasks: parseInt(e.target.value) || 1 })}
              className="input"
              min="1"
              required
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="text"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="input"
              placeholder="e.g., Nov 15, 2025"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn btn-primary"
            >
              {mode === 'create' ? 'Add Course' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
