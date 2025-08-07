export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'tutor' | 'admin' | 'parent';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student extends User {
  role: 'student';
  grade?: string;
  subjects?: string[];
  parentContact?: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface Tutor extends User {
  role: 'tutor';
  subjects?: string[];
  qualifications?: string[];
  hourlyRate: number;
  availability?: TimeSlot[];
  rating?: number;
  totalSessions: number;
}

export interface Admin extends User {
  role: 'admin';
  permissions?: string[];
}

export interface Parent extends User {
  role: 'parent';
  children?: string[]; // Array of student IDs
}

export interface TimeSlot {
  id: string;
  dayOfWeek: number; // 0-6, 0 = Sunday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isAvailable: boolean;
}

export interface TutoringSession {
  id: string;
  studentId: string;
  tutorId: string;
  subject: string;
  scheduledAt: Date;
  duration: number; // in minutes
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  rating?: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subject {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export interface Progress {
  id: string;
  studentId: string;
  subjectId: string;
  score: number;
  assessment: string;
  date: Date;
  notes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'session_reminder' | 'session_cancelled' | 'new_message' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface SessionFilters {
  status?: TutoringSession['status'];
  subject?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tutorId?: string;
  studentId?: string;
}

export interface DashboardStats {
  totalSessions: number;
  upcomingSessions: number;
  completedSessions: number;
  avgRating?: number;
  totalEarnings?: number;
  totalStudents?: number;
}