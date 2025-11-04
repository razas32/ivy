const STORAGE_PREFIX = 'ivy-study-assistant';

export const STORAGE_KEYS = {
  courses: `${STORAGE_PREFIX}:courses`,
  tasks: `${STORAGE_PREFIX}:tasks`,
  deadlines: `${STORAGE_PREFIX}:deadlines`,
};

const isBrowser = () => typeof window !== 'undefined';

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
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
