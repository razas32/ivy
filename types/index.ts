export interface Course {
  id: string;
  code: string;
  name: string;
  color: CourseColor;
  progress: number; // 0-100
  tasksCompleted: number;
  totalTasks: number;
  dueDate: string;
}

export type CourseColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink';

export interface Task {
  id: string;
  courseId: string;
  title: string;
  completed: boolean;
  createdAt: string;
  parentTaskId?: string | null;
  dueDate?: string | null;
  priority?: 'low' | 'medium' | 'high';
  description?: string | null;
  category?: string | null;
}

export interface Deadline {
  id: string;
  courseId: string;
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  description?: string | null;
}

export interface DashboardStats {
  tasksCompleted: number;
  totalTasks: number;
  upcomingDeadlines: number;
  activeCourses: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ExtractedInstructor {
  name: string;
  email?: string | null;
  office?: string | null;
  officeHours?: string | null;
}

export interface ExtractedDeadline {
  title: string;
  dueDate: string;
  description?: string | null;
  priority: 'low' | 'medium' | 'high';
}

export interface ExtractedTask {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority: 'low' | 'medium' | 'high';
  category?: string | null;
}

export interface ExtractedCourse {
  courseCode: string;
  courseName: string;
  term?: string | null;
  program?: string | null;
  description?: string | null;
  meetingInfo?: string[];
  instructors?: ExtractedInstructor[];
  notes?: string[];
  deadlines: ExtractedDeadline[];
  tasks: ExtractedTask[];
}

export interface CourseExtractionResult {
  courses: ExtractedCourse[];
  summary?: string | null;
  immediateActions?: string[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export type QuizQuestionType = 'mcq' | 'truefalse' | 'fill';

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  options?: string[];
  answer: string;
}

export interface ResumeAnalysisReport {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  seniorityCues: string[];
  recommendations: string[];
  extractedResumePreview: string;
}

export interface CoverLetterGenerationResult {
  draft: string;
  outline: string[];
  keywordsUsed: string[];
}

export interface GeneratedAsset {
  id: string;
  type: 'flashcards' | 'quiz' | 'cover_letter';
  title: string;
  createdAt: string;
  content: string;
}
