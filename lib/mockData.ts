import { Course, DashboardStats, Task, Deadline } from '@/types';

export const mockCourses: Course[] = [
  {
    id: '1',
    code: 'CS101',
    name: 'Introduction to Computer Science',
    color: 'blue',
    progress: 50,
    tasksCompleted: 1,
    totalTasks: 2,
    dueDate: 'Oct 30, 2025',
  },
  {
    id: '2',
    code: 'MATH202',
    name: 'Calculus II',
    color: 'purple',
    progress: 50,
    tasksCompleted: 1,
    totalTasks: 2,
    dueDate: 'Nov 2, 2025',
  },
  {
    id: '3',
    code: 'BIO150',
    name: 'General Biology',
    color: 'green',
    progress: 0,
    tasksCompleted: 0,
    totalTasks: 1,
    dueDate: 'Nov 5, 2025',
  },
  {
    id: '4',
    code: 'HIST301',
    name: 'World History',
    color: 'orange',
    progress: 50,
    tasksCompleted: 1,
    totalTasks: 2,
    dueDate: 'Nov 8, 2025',
  },
  {
    id: '5',
    code: 'ECON101',
    name: 'Principles of Economics',
    color: 'red',
    progress: 0,
    tasksCompleted: 0,
    totalTasks: 1,
    dueDate: 'Nov 15, 2025',
  },
  {
    id: '6',
    code: 'ENG205',
    name: 'English Literature',
    color: 'pink',
    progress: 50,
    tasksCompleted: 1,
    totalTasks: 2,
    dueDate: 'Nov 2, 2025',
  },
];

export const mockTasks: Task[] = [
  {
    id: '1',
    courseId: '2',
    title: 'Practice integration problems',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    courseId: '2',
    title: 'Watch tutorial videos',
    completed: true,
    createdAt: new Date().toISOString(),
  },
];

export const mockDeadlines: Deadline[] = [
  {
    id: '1',
    courseId: '2',
    title: 'Problem Set 5',
    dueDate: 'Nov 2, 2025',
    priority: 'medium',
  },
];

export const mockStats: DashboardStats = {
  tasksCompleted: 4,
  totalTasks: 10,
  upcomingDeadlines: 5,
  activeCourses: 6,
};
