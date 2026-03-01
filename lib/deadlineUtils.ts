import { Deadline } from '@/types';
import { getDeadlineStatus as getSharedDeadlineStatus, parseFlexibleDate } from '@/lib/core/deadlineLogic';

export { parseFlexibleDate } from '@/lib/core/deadlineLogic';

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

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
  return getSharedDeadlineStatus(deadlines);
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
