export interface DeadlineLike {
  dueDate: string;
}

const MONTH_MAP: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

export interface DeadlineStatus<T extends DeadlineLike> {
  nextDeadline: T | null;
  closestDeadline: T | null;
  isFinished: boolean;
  hasUpcoming: boolean;
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function parseFlexibleDate(dateString: string): Date {
  const normalized = dateString.trim();
  if (!normalized) return new Date('invalid');

  let date = new Date(normalized);
  if (!Number.isNaN(date.getTime())) return date;

  const customFormatMatch = normalized.match(/(?:\w+\.?\s+)?([A-Za-z]+)\.?\s+(\d{1,2})(?:\D|$)/);
  if (customFormatMatch) {
    const [, monthRaw, dayRaw] = customFormatMatch;
    const monthKey = monthRaw.toLowerCase().replace('.', '');
    const day = Number.parseInt(dayRaw, 10);
    const currentYear = new Date().getFullYear();

    const monthNum = MONTH_MAP[monthKey];
    if (monthNum !== undefined && Number.isFinite(day)) {
      date = new Date(currentYear, monthNum, day);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }

  return new Date('invalid');
}

export function getDeadlineStatus<T extends DeadlineLike>(deadlines: T[]): DeadlineStatus<T> {
  if (deadlines.length === 0) {
    return {
      nextDeadline: null,
      closestDeadline: null,
      isFinished: false,
      hasUpcoming: false,
    };
  }

  const today = startOfDay(new Date());

  const parsed = deadlines
    .map(deadline => ({
      deadline,
      parsedDate: parseFlexibleDate(deadline.dueDate),
    }))
    .filter(item => !Number.isNaN(item.parsedDate.getTime()))
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

  if (parsed.length === 0) {
    return {
      nextDeadline: null,
      closestDeadline: null,
      isFinished: false,
      hasUpcoming: false,
    };
  }

  const upcoming = parsed.find(item => startOfDay(item.parsedDate) >= today) || null;
  const closest = upcoming || parsed[parsed.length - 1];

  return {
    nextDeadline: upcoming ? upcoming.deadline : null,
    closestDeadline: closest ? closest.deadline : null,
    isFinished: !upcoming && parsed.length > 0,
    hasUpcoming: Boolean(upcoming),
  };
}
