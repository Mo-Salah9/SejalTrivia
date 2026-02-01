const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('admin_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('admin_token');
    }
    return this.token;
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('admin_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.message || `API error: ${response.status}`);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error: any) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const response = await this.post<{ token: string; user: any }>('/auth/signin', {
      email,
      password,
    });
    this.setToken(response.token);
    return response;
  }

  // Categories
  async getCategories(): Promise<any[]> {
    const response = await this.get<{ categories: any[] }>('/categories');
    return response.categories || [];
  }

  async saveCategories(categories: any[]): Promise<void> {
    return this.post('/categories', { categories });
  }

  // Users
  async getAllUsers(): Promise<any[]> {
    return this.get('/admin/users');
  }

  async updateUser(userId: string, updates: any): Promise<void> {
    return this.put(`/admin/users/${userId}`, updates);
  }

  async deleteUser(userId: string): Promise<void> {
    return this.delete(`/admin/users/${userId}`);
  }

  // Settings
  async getSettings(): Promise<any> {
    return this.get('/admin/settings');
  }

  async updateSettings(settings: any): Promise<void> {
    return this.put('/admin/settings', settings);
  }

  // Purchases
  async getAllPurchases(): Promise<any[]> {
    return this.get('/admin/purchases');
  }
}

export const apiService = new ApiService();
