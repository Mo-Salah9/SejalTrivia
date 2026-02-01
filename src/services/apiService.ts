/**
 * API Service Layer
 * Handles all HTTP requests to the backend API
 */

import Config from 'react-native-config';
import { storage } from '../utils/storage';

const API_BASE_URL = Config.API_BASE_URL || 'http://localhost:3000/api';

class ApiService {
  private token: string | null = null;
  private tokenLoaded = false;

  /**
   * Set authentication token
   */
  async setToken(token: string): Promise<void> {
    this.token = token;
    this.tokenLoaded = true;
    await storage.setItem('auth_token', token);
  }

  /**
   * Get authentication token
   */
  async getToken(): Promise<string | null> {
    if (!this.tokenLoaded) {
      this.token = await storage.getItem('auth_token');
      this.tokenLoaded = true;
    }
    return this.token;
  }

  /**
   * Clear authentication token
   */
  async clearToken(): Promise<void> {
    this.token = null;
    this.tokenLoaded = true;
    await storage.removeItem('auth_token');
  }

  /**
   * Make HTTP request to API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = await this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
      Accept: 'application/json; charset=utf-8',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    console.log('API Request:', JSON.stringify({
      method: options.method || 'GET',
      url,
      hasToken: !!token,
      endpoint,
    }));

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          body: errorText,
        });

        let errorData: any;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = {message: errorText};
        }

        if (response.status === 403 && errorData.requiresVerification) {
          const error: any = new Error(
            errorData.error || errorData.message || 'Verification required',
          );
          error.requiresVerification = true;
          error.email = errorData.email;
          throw error;
        }

        throw new Error(
          errorData.error ||
            errorData.message ||
            `API error: ${response.status}`,
        );
      }

      if (response.status === 204) {
        return {} as T;
      }

      const text = await response.text();
      const data = JSON.parse(text);
      console.log('API Success:', {endpoint, dataKeys: Object.keys(data)});
      return data;
    } catch (error: any) {
      console.error('API Request Failed:', JSON.stringify({
        message: error.message,
        name: error.name,
        url,
        method: options.method || 'GET',
      }));
      throw error;
    }
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {method: 'GET'});
  }

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {method: 'DELETE'});
  }

  put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
