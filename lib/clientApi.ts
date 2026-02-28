import { Course, Deadline, Flashcard, QuizQuestion, Task } from '@/types';
import { getOpenAIKeyHeader } from '@/lib/openaiKey';

interface BootstrapResponse {
  courses: Course[];
  tasks: Task[];
  deadlines: Deadline[];
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
}

interface ApiRequestOptions {
  requestInit?: RequestInit;
  triggerAuthModalOn401?: boolean;
}

async function apiRequest<T>(input: string, options?: ApiRequestOptions): Promise<T> {
  const init = options?.requestInit;
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  for (const [key, value] of getOpenAIKeyHeader().entries()) {
    headers.set(key, value);
  }

  const response = await fetch(input, {
    ...init,
    headers,
    cache: 'no-store',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && options?.triggerAuthModalOn401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ivy-auth-required'));
    }
    throw new Error(data?.error || `Request failed: ${response.status}`);
  }

  return data as T;
}

export async function fetchBootstrap() {
  return apiRequest<BootstrapResponse>('/api/data/bootstrap');
}

export async function createCourse(course: Pick<Course, 'id' | 'code' | 'name' | 'color' | 'dueDate'>) {
  return apiRequest<{ id: string }>('/api/courses', {
    triggerAuthModalOn401: true,
    requestInit: {
      method: 'POST',
      body: JSON.stringify(course),
    },
  });
}

export async function updateCourse(id: string, changes: Partial<Pick<Course, 'code' | 'name' | 'color' | 'dueDate'>>) {
  return apiRequest<{ ok: true }>(`/api/courses/${id}`, {
    triggerAuthModalOn401: true,
    requestInit: {
      method: 'PATCH',
      body: JSON.stringify(changes),
    },
  });
}

export async function deleteCourse(id: string) {
  return apiRequest<{ ok: true }>(`/api/courses/${id}`, {
    triggerAuthModalOn401: true,
    requestInit: {
      method: 'DELETE',
    },
  });
}

export async function createTask(task: Task) {
  return apiRequest<{ id: string }>('/api/tasks', {
    triggerAuthModalOn401: true,
    requestInit: {
      method: 'POST',
      body: JSON.stringify(task),
    },
  });
}

export async function updateTask(id: string, changes: Partial<Task>) {
  return apiRequest<{ ok: true }>(`/api/tasks/${id}`, {
    triggerAuthModalOn401: true,
    requestInit: {
      method: 'PATCH',
      body: JSON.stringify(changes),
    },
  });
}

export async function deleteTask(id: string) {
  return apiRequest<{ ok: true }>(`/api/tasks/${id}`, {
    triggerAuthModalOn401: true,
    requestInit: {
      method: 'DELETE',
    },
  });
}

export async function createDeadline(deadline: Deadline) {
  return apiRequest<{ id: string }>('/api/deadlines', {
    triggerAuthModalOn401: true,
    requestInit: {
      method: 'POST',
      body: JSON.stringify(deadline),
    },
  });
}

export async function updateDeadline(id: string, changes: Partial<Deadline>) {
  return apiRequest<{ ok: true }>(`/api/deadlines/${id}`, {
    triggerAuthModalOn401: true,
    requestInit: {
      method: 'PATCH',
      body: JSON.stringify(changes),
    },
  });
}

export async function deleteDeadline(id: string) {
  return apiRequest<{ ok: true }>(`/api/deadlines/${id}`, {
    triggerAuthModalOn401: true,
    requestInit: {
      method: 'DELETE',
    },
  });
}

export async function persistFlashcards(cards: Flashcard[]) {
  return apiRequest<{ ok: true }>('/api/study/flashcards', {
    triggerAuthModalOn401: true,
    requestInit: {
      method: 'PUT',
      body: JSON.stringify({ cards }),
    },
  });
}

export async function persistQuizQuestions(questions: QuizQuestion[]) {
  return apiRequest<{ ok: true }>('/api/study/quizzes', {
    triggerAuthModalOn401: true,
    requestInit: {
      method: 'PUT',
      body: JSON.stringify({ questions }),
    },
  });
}

export async function saveCareerAsset(payload: { type: 'cover_letter' | 'resume_report'; title: string; content: unknown }) {
  return apiRequest<{ id: string }>('/api/career-assets', {
    triggerAuthModalOn401: true,
    requestInit: {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  });
}
