const STORAGE_PREFIX = 'ivy-study-assistant';

export const STORAGE_KEYS = {
  courses: `${STORAGE_PREFIX}:courses`,
  tasks: `${STORAGE_PREFIX}:tasks`,
  deadlines: `${STORAGE_PREFIX}:deadlines`,
  flashcards: `${STORAGE_PREFIX}:flashcards`,
  quizzes: `${STORAGE_PREFIX}:quizzes`,
  generatedAssets: `${STORAGE_PREFIX}:generated-assets`,
  careerReports: `${STORAGE_PREFIX}:career-reports`,
};

const isBrowser = () => typeof window !== 'undefined';

function isFallbackTypeMatch<T>(value: unknown, fallback: T): value is T {
  if (Array.isArray(fallback)) {
    return Array.isArray(value);
  }

  if (fallback === null) {
    return value === null;
  }

  const fallbackType = typeof fallback;
  if (fallbackType === 'object') {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  return typeof value === fallbackType;
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    return isFallbackTypeMatch(parsed, fallback) ? parsed : fallback;
  } catch (error) {
    console.warn(`Failed to load data from localStorage for key "${key}"`, error);
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T) {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save data to localStorage for key "${key}"`, error);
  }
}

export async function loadPersisted<T>(key: string, fallback: T): Promise<T> {
  return loadFromStorage<T>(key, fallback);
}

export async function savePersisted<T>(key: string, value: T): Promise<void> {
  saveToStorage<T>(key, value);
}
