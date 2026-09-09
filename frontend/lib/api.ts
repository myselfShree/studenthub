const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('studenthub_token');
    }
    return null;
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (_) {}

        if (response.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          localStorage.removeItem('studenthub_token');
          localStorage.removeItem('studenthub_user');
          window.location.href = '/login';
        }

        throw new Error(errorMessage);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      throw new Error(err.message || 'Network request failed. Ensure backend server is active.');
    }
  }

  // Generic HTTP methods for direct use in page components
  async get<T = any>(endpoint: string, params?: Record<string, string>): Promise<T> {
    let url = endpoint;
    if (params && Object.keys(params).length > 0) {
      const qs = new URLSearchParams(params).toString();
      url = `${endpoint}?${qs}`;
    }
    return this.request<T>(url);
  }

  async post<T = any>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async upload<T = any>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  }

  // Authentication
  async register(data: { name: string; email: string; password: string }) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  // Dashboard
  async getDashboardSummary() {
    return this.request<any>('/dashboard/summary');
  }

  // Subjects
  async getSubjects() {
    return this.request<any[]>('/subjects');
  }

  async createSubject(data: { name: string; color?: string }) {
    return this.request<any>('/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteSubject(id: number) {
    return this.request<any>(`/subjects/${id}`, { method: 'DELETE' });
  }

  // Notes
  async getNotes(params?: { subject_id?: number; search?: string }) {
    const query = new URLSearchParams();
    if (params?.subject_id) query.append('subject_id', params.subject_id.toString());
    if (params?.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<any[]>(`/notes${qs}`);
  }

  async getNote(id: number) {
    return this.request<any>(`/notes/${id}`);
  }

  async createNote(data: { title: string; content: string; subject_id?: number | null }) {
    return this.request<any>('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNote(id: number, data: { title?: string; content?: string; subject_id?: number | null }) {
    return this.request<any>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNote(id: number) {
    return this.request<any>(`/notes/${id}`, { method: 'DELETE' });
  }

  // Tasks
  async getTasks(params?: { status?: string; priority?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.priority) query.append('priority', params.priority);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<any[]>(`/tasks${qs}`);
  }

  async createTask(data: { title: string; description?: string; priority?: string; due_date?: string | null }) {
    return this.request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTaskStatus(id: number, status: 'pending' | 'in_progress' | 'completed') {
    return this.request<any>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteTask(id: number) {
    return this.request<any>(`/tasks/${id}`, { method: 'DELETE' });
  }

  // Habits
  async getHabits() {
    return this.request<any[]>('/habits');
  }

  async createHabit(data: { name: string; description?: string; target_frequency?: string }) {
    return this.request<any>('/habits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkinHabit(id: number, completed_date?: string) {
    return this.request<any>(`/habits/${id}/checkin`, {
      method: 'POST',
      body: JSON.stringify(completed_date ? { completed_date } : {}),
    });
  }

  async deleteCheckinHabit(id: number, completed_date?: string) {
    const qs = completed_date ? `?completed_date=${completed_date}` : '';
    return this.request<any>(`/habits/${id}/checkin${qs}`, {
      method: 'DELETE',
    });
  }

  async deleteHabit(id: number) {
    return this.request<any>(`/habits/${id}`, { method: 'DELETE' });
  }

  // Files & QR
  async uploadFile(formData: FormData) {
    return this.request<any>('/files/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async getFiles() {
    return this.request<any[]>('/files');
  }

  async createShare(fileId: number, data: { expires_in_hours?: number; max_downloads?: number }) {
    return this.request<any>(`/files/${fileId}/share`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPublicShareInfo(token: string) {
    return this.request<any>(`/files/shared/${token}`);
  }

  async deleteFile(fileId: number) {
    return this.request<any>(`/files/${fileId}`, { method: 'DELETE' });
  }

  // AI Study Assistant
  async aiSummarize(data: { note_id?: number; content?: string }) {
    return this.request<any>('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async aiKeyPoints(data: { note_id?: number; content?: string }) {
    return this.request<any>('/ai/key-points', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async aiGenerateQuiz(data: { note_id?: number; content?: string; num_questions?: number }) {
    return this.request<any>('/ai/generate-quiz', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async aiExplain(data: { topic: string; context?: string }) {
    return this.request<any>('/ai/explain', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Resources
  async getResources(params?: { subject_id?: number; resource_type?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.subject_id) query.append('subject_id', params.subject_id.toString());
    if (params?.resource_type) query.append('resource_type', params.resource_type);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<any[]>(`/resources${qs}`);
  }

  async createResource(data: { title: string; url: string; resource_type?: string; notes?: string; subject_id?: number | null }) {
    return this.request<any>('/resources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteResource(id: number) {
    return this.request<any>(`/resources/${id}`, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
