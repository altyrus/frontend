import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Equipment, EquipmentCommand } from '@/types/equipment';

class APIService {
  private client: AxiosInstance;

  constructor(baseURL: string = import.meta.env.VITE_API_URL || '/api') {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Equipment endpoints
  async getEquipment(id: string): Promise<Equipment> {
    const response = await this.client.get<Equipment>(`/equipment/${id}`);
    return response.data;
  }

  async getAllEquipment(): Promise<Equipment[]> {
    const response = await this.client.get<Equipment[]>('/equipment');
    return response.data;
  }

  async getEquipmentByType(type: string): Promise<Equipment[]> {
    const response = await this.client.get<Equipment[]>(`/equipment/type/${type}`);
    return response.data;
  }

  async sendCommand(command: EquipmentCommand): Promise<void> {
    await this.client.post(`/equipment/${command.equipmentId}/commands`, command);
  }

  async updateEquipment(id: string, updates: Partial<Equipment>): Promise<Equipment> {
    const response = await this.client.patch<Equipment>(`/equipment/${id}`, updates);
    return response.data;
  }

  async getEquipmentHistory(id: string, from: Date, to: Date): Promise<unknown[]> {
    const response = await this.client.get(`/equipment/${id}/history`, {
      params: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
    });
    return response.data;
  }

  // Authentication
  async login(username: string, password: string): Promise<string> {
    const response = await this.client.post<{ token: string }>('/auth/login', {
      username,
      password,
    });
    const token = response.data.token;
    localStorage.setItem('auth_token', token);
    return token;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
    localStorage.removeItem('auth_token');
  }

  // System endpoints
  async getSystemStatus(): Promise<unknown> {
    const response = await this.client.get('/system/status');
    return response.data;
  }

  async getAlerts(): Promise<unknown[]> {
    const response = await this.client.get('/alerts');
    return response.data;
  }

  // Generic request method
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }
}

export const apiService = new APIService();
