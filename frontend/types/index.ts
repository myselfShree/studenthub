// Types for Student Hub Frontend

export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Subject {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface Note {
  id: number;
  user_id: number;
  subject_id: number | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  subject?: Subject | null;
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  due_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: number;
  user_id: number;
  name: string;
  description?: string | null;
  target_frequency: string;
  created_at: string;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  completed_today: boolean;
  recent_history: string[];
}

export interface FileMetadata {
  id: number;
  user_id: number;
  filename: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface FileShare {
  id: number;
  file_id: number;
  share_token: string;
  expires_at?: string | null;
  max_downloads?: number | null;
  download_count: number;
  is_active: boolean;
  created_at: string;
  share_url?: string;
  qr_code_url?: string;
}

export interface PublicFileShareInfo {
  filename: string;
  file_size: number;
  mime_type: string;
  expires_at?: string | null;
  max_downloads?: number | null;
  download_count: number;
  is_active: boolean;
  download_url: string;
}

export interface Resource {
  id: number;
  user_id: number;
  subject_id: number | null;
  title: string;
  url: string;
  resource_type: 'video' | 'article' | 'github' | 'pdf' | 'book' | 'link';
  notes?: string | null;
  created_at: string;
  subject?: Subject | null;
}

export interface MetricCounts {
  total_subjects: number;
  total_notes: number;
  total_tasks: number;
  total_habits: number;
  total_files: number;
  total_resources: number;
  total_ai_interactions: number;
}

export interface DashboardOverview {
  student_name: string;
  student_email: string;
  metrics: MetricCounts;
  tasks: {
    pending_count: number;
    completed_count: number;
    urgent_count: number;
    upcoming_tasks: Task[];
  };
  habits: {
    total_habits: number;
    completed_today_count: number;
    habits: Habit[];
  };
  recent_notes: Note[];
  recent_resources: Resource[];
}

export interface AIQuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface AIQuizResponse {
  questions: AIQuizQuestion[];
  interaction_id?: number | null;
}

export interface AISummaryResponse {
  summary: string;
  key_takeaway: string;
  interaction_id?: number | null;
}

export interface AIKeyPointsResponse {
  key_points: string[];
  interaction_id?: number | null;
}

export interface AIExplainResponse {
  topic: string;
  explanation: string;
  interaction_id?: number | null;
}
