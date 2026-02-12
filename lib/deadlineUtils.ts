import { Deadline } from '@/types';

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

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

/**
 * Parse various date formats into a Date object
 * Supports formats like:
 * - "Mon. Nov. 24 @ 9:00am"
 * - "2024-11-24"
 * - "November 24, 2024"
 * - ISO strings
 */
export function parseFlexibleDate(dateString: string): Date {
  const normalized = dateString.trim();
  if (!normalized) return new Date('invalid');

  // Try standard Date parsing first
  let date = new Date(normalized);
  if (!Number.isNaN(date.getTime())) return date;

  // Handle formats like "Mon. Nov. 24 @ 9:00am" and "Nov 24"
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

  // Return invalid date if all parsing fails
  return new Date('invalid');
}

/**
 * Finds the next upcoming deadline from a list of deadlines
 * Returns the earliest future deadline, or the most recent past deadline if all are overdue
 */
export function getNextDeadline(deadlines: Deadline[]): Deadline | null {
  const { nextDeadline, closestDeadline } = getDeadlineStatus(deadlines);
  return nextDeadline || closestDeadline;
}

/**
 * Formats a deadline into a human-readable, intelligent display string
 */
export function formatDeadlineDisplay(deadline: Deadline | null): string {
  if (!deadline) return 'No deadlines';

  const now = startOfDay(new Date());
  const deadlineDate = parseFlexibleDate(deadline.dueDate);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return `${absDays} day${absDays === 1 ? '' : 's'} overdue`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`;
  } else {
    return deadlineDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: deadlineDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

/**
 * Checks if a deadline text indicates an overdue status
 */
export function isDeadlineOverdue(deadlineText: string): boolean {
  return deadlineText.includes('overdue');
}

/**
 * Checks if a deadline is urgent (today or tomorrow)
 */
export function isDeadlineUrgent(deadlineText: string): boolean {
  return deadlineText.includes('today') || deadlineText.includes('tomorrow');
}

export interface DeadlineStatus {
  nextDeadline: Deadline | null;
  closestDeadline: Deadline | null;
  isFinished: boolean;
  hasUpcoming: boolean;
}

/**
 * Determines the upcoming deadline, the closest deadline (even if past), and whether
 * the course timeline is finished (all deadlines are in the past).
 */
export function getDeadlineStatus(deadlines: Deadline[]): DeadlineStatus {
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
    .filter(item => !isNaN(item.parsedDate.getTime()))
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

/**
 * Formats a deadline into a readable absolute date string for UI display
 */
export function formatAbsoluteDeadlineDate(deadline: Deadline | null): string | null {
  if (!deadline) return null;

  const parsed = parseFlexibleDate(deadline.dueDate);
  if (isNaN(parsed.getTime())) {
    return deadline.dueDate || null;
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: parsed.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}
