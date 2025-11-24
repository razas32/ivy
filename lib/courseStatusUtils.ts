import { Deadline } from '@/types';

export interface CourseStatus {
  status: string;
  message: string;
  color: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
}

/**
 * Determines intelligent course status based on task progress and deadlines
 * @param progressPercentage - Task completion percentage (0-100)
 * @param deadlines - Array of course deadlines
 * @param tasksCount - Number of tasks (for context)
 * @returns CourseStatus object with status text, motivational message, and color
 */
export function getCourseStatus(
  progressPercentage: number,
  deadlines: Deadline[],
  tasksCount: number
): CourseStatus {
  // Calculate days until nearest deadline
  const daysUntilDeadline = getDaysUntilNearestDeadline(deadlines);

  // Course completed
  if (progressPercentage === 100) {
    return {
      status: 'Completed',
      message: 'Up to date! Great work!',
      color: 'green',
    };
  }

  // No deadlines set - use task progress only
  if (daysUntilDeadline === null) {
    if (progressPercentage === 0) {
      return {
        status: 'Getting Started',
        message: 'Ready to begin? Add some tasks!',
        color: 'gray',
      };
    } else if (progressPercentage < 30) {
      return {
        status: 'In Progress',
        message: 'You\'re on your way!',
        color: 'blue',
      };
    } else if (progressPercentage < 70) {
      return {
        status: 'Making Progress',
        message: 'Keep the momentum going!',
        color: 'blue',
      };
    } else {
      return {
        status: 'Nearly There',
        message: 'Almost finished!',
        color: 'green',
      };
    }
  }

  // Deadlines exist - assess urgency vs progress
  const isUrgent = daysUntilDeadline <= 7;
  const isOverdue = daysUntilDeadline < 0;

  // Overdue scenarios
  if (isOverdue) {
    if (progressPercentage < 50) {
      return {
        status: 'Behind Schedule',
        message: 'Time to catch up! Focus on priorities.',
        color: 'red',
      };
    } else if (progressPercentage < 90) {
      return {
        status: 'Needs Attention',
        message: 'Push through - you\'re almost there!',
        color: 'red',
      };
    } else {
      return {
        status: 'Final Push',
        message: 'So close! Finish strong!',
        color: 'yellow',
      };
    }
  }

  // Urgent (within 7 days) scenarios
  if (isUrgent) {
    if (progressPercentage < 30) {
      return {
        status: 'Needs Focus',
        message: 'Deadline approaching - time to accelerate!',
        color: 'red',
      };
    } else if (progressPercentage < 70) {
      return {
        status: 'Crunch Time',
        message: 'Deadline near - stay focused!',
        color: 'yellow',
      };
    } else {
      return {
        status: 'Final Sprint',
        message: 'Almost done! You\'ve got this!',
        color: 'yellow',
      };
    }
  }

  // Good time buffer (more than 7 days)
  if (progressPercentage === 0) {
    return {
      status: 'Just Starting',
      message: 'Let\'s build momentum!',
      color: 'gray',
    };
  } else if (progressPercentage < 25) {
    if (daysUntilDeadline > 30) {
      return {
        status: 'Early Days',
        message: 'Plenty of time - stay consistent!',
        color: 'blue',
      };
    } else {
      return {
        status: 'Getting Started',
        message: 'Good pace, keep it up!',
        color: 'blue',
      };
    }
  } else if (progressPercentage < 50) {
    if (daysUntilDeadline > 30) {
      return {
        status: 'Ahead of Schedule',
        message: 'Excellent progress!',
        color: 'green',
      };
    } else {
      return {
        status: 'On Track',
        message: 'Steady progress!',
        color: 'blue',
      };
    }
  } else if (progressPercentage < 75) {
    if (daysUntilDeadline > 30) {
      return {
        status: 'Way Ahead',
        message: 'Outstanding work!',
        color: 'green',
      };
    } else {
      return {
        status: 'On Track',
        message: 'You\'re doing great!',
        color: 'green',
      };
    }
  } else if (progressPercentage < 90) {
    return {
      status: 'Nearly Complete',
      message: 'The finish line is in sight!',
      color: 'green',
    };
  } else {
    return {
      status: 'Final Touches',
      message: 'Almost perfect - wrap it up!',
      color: 'green',
    };
  }
}

/**
 * Calculates days until the nearest upcoming deadline
 * Returns null if no deadlines exist
 * Returns negative number if deadline has passed
 */
function getDaysUntilNearestDeadline(deadlines: Deadline[]): number | null {
  if (deadlines.length === 0) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const sortedDeadlines = deadlines
    .map(d => {
      const deadlineDate = new Date(d.dueDate);
      deadlineDate.setHours(0, 0, 0, 0);
      const diffTime = deadlineDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        ...d,
        daysUntil: diffDays,
      };
    })
    .filter(d => !isNaN(d.daysUntil))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  if (sortedDeadlines.length === 0) return null;

  // Find first upcoming deadline (>= 0 days)
  const upcoming = sortedDeadlines.find(d => d.daysUntil >= 0);

  // If all deadlines passed, return the most recent (least negative)
  return upcoming ? upcoming.daysUntil : sortedDeadlines[sortedDeadlines.length - 1].daysUntil;
}

/**
 * Gets appropriate text color class for status color
 */
export function getStatusColorClass(color: CourseStatus['color']): string {
  const colorMap = {
    green: 'text-green-700',
    blue: 'text-blue-700',
    yellow: 'text-yellow-700',
    red: 'text-red-700',
    gray: 'text-gray-700',
  };
  return colorMap[color];
}

/**
 * Gets appropriate background color class for status color
 */
export function getStatusBgClass(color: CourseStatus['color']): string {
  const colorMap = {
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200',
    gray: 'bg-gray-50 border-gray-200',
  };
  return colorMap[color];
}
