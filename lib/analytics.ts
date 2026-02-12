import { Deadline, Task } from '@/types';
import { parseFlexibleDate } from '@/lib/deadlineUtils';

export interface WeeklyBucket {
  label: string;
  completed: number;
  created: number;
}

export interface AnalyticsSummary {
  completedTasks: number;
  totalTasks: number;
  overdueDeadlines: number;
  dueSoonDeadlines: number;
  burnDown: WeeklyBucket[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function weekLabel(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay());
  const year = copy.getFullYear();
  const month = String(copy.getMonth() + 1).padStart(2, '0');
  const day = String(copy.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildAnalytics(tasks: Task[], deadlines: Deadline[]): AnalyticsSummary {
  const rootTasks = tasks.filter((task) => !task.parentTaskId);
  const completedTasks = rootTasks.filter((task) => task.completed).length;
  const totalTasks = rootTasks.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueSoonCutoff = new Date(today.getTime() + 7 * DAY_MS);

  let overdueDeadlines = 0;
  let dueSoonDeadlines = 0;

  for (const deadline of deadlines) {
    const parsed = parseFlexibleDate(deadline.dueDate);
    if (Number.isNaN(parsed.getTime())) continue;
    parsed.setHours(0, 0, 0, 0);

    if (parsed < today) {
      overdueDeadlines += 1;
    } else if (parsed <= dueSoonCutoff) {
      dueSoonDeadlines += 1;
    }
  }

  const byWeek = new Map<string, WeeklyBucket>();
  rootTasks.forEach((task) => {
    const createdDate = parseFlexibleDate(task.createdAt || new Date().toISOString());
    const key = weekLabel(createdDate);
    const current = byWeek.get(key) || { label: key, completed: 0, created: 0 };
    current.created += 1;
    if (task.completed) current.completed += 1;
    byWeek.set(key, current);
  });

  const burnDown = [...byWeek.values()].sort((a, b) => a.label.localeCompare(b.label)).slice(-8);

  return {
    completedTasks,
    totalTasks,
    overdueDeadlines,
    dueSoonDeadlines,
    burnDown,
  };
}
