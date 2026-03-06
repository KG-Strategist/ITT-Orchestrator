import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

/**
 * API Response wrapper for consistent error/success handling
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

/**
 * Create axios instance with JWT interceptors
 */
const createApiClient = (): AxiosInstance => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  /**
   * Request interceptor: Inject JWT token into Authorization header
   */
  client.interceptors.request.use(
    (config) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  /**
   * Response interceptor: Handle 401 (token expired) and other errors
   */
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Handle 401 Unauthorized (token expired/invalid)
      if (error.response?.status === 401) {
        const authStore = useAuthStore.getState();
        authStore.logout?.();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Handle 403 Forbidden (insufficient permissions)
      if (error.response?.status === 403) {
        const errorMsg = 'You do not have permission to access this resource.';
        console.error(errorMsg);
        return Promise.reject(new Error(errorMsg));
      }

      // Handle 429 Too Many Requests (rate limited)
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || '60';
        const errorMsg = `Rate limited. Please wait ${retryAfter}s before retrying.`;
        console.warn(errorMsg);
        return Promise.reject(new Error(errorMsg));
      }

      // Handle 5xx server errors
      if (error.response?.status && error.response.status >= 500) {
        const errorMsg = 'Server error. Please try again later.';
        console.error(errorMsg, error.response.data);
        return Promise.reject(new Error(errorMsg));
      }

      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Main API client instance
 */
export const apiClient = createApiClient();

/**
 * Helper functions for common operations
 */
export const api = {
  get: async <T = unknown>(url: string): Promise<T> => {
    const response = await apiClient.get<T>(url);
    return response.data;
  },

  post: async <T = unknown, D = unknown>(url: string, data?: D): Promise<T> => {
    const response = await apiClient.post<T>(url, data);
    return response.data;
  },

  put: async <T = unknown, D = unknown>(url: string, data?: D): Promise<T> => {
    const response = await apiClient.put<T>(url, data);
    return response.data;
  },

  patch: async <T = unknown, D = unknown>(url: string, data?: D): Promise<T> => {
    const response = await apiClient.patch<T>(url, data);
    return response.data;
  },

  delete: async <T = unknown>(url: string): Promise<T> => {
    const response = await apiClient.delete<T>(url);
    return response.data;
  },
};

/**
 * Domain-specific API endpoints
 */
export const apiEndpoints = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
  },
  setup: {
    status: '/setup/status',
    init: '/setup/init',
  },
  registry: {
    list: '/registry',
    get: (id: string) => `/registry/${id}`,
    delete: (id: string) => `/registry/${id}`,
  },
  integrations: {
    list: '/integrations',
    scan: '/integrations',
  },
  zones: {
    list: '/zones',
    create: '/zones',
  },
  mdm: {
    rules: {
      list: '/mdm/rules',
      create: '/mdm/rules',
      delete: (id: string) => `/mdm/rules/${id}`,
    },
  },
  dag: {
    generate: '/generate-dag',
  },
  gvm: {
    manifest: '/gvm/manifest',
  },
  health: {
    live: '/health',
    ready: '/readiness',
  },
};

export default apiClient;
