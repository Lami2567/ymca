import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

interface CacheEntry {
  response: {
    data: any;
    status: number;
    statusText: string;
    headers: any;
  };
  timestamp: number;
}

const getCache = new Map<string, CacheEntry>();

function getCacheKey(config: any): string {
  const url = config.url || '';
  const params = config.params ? JSON.stringify(config.params) : '';
  return `${url}?${params}`;
}

// Request interceptor to add auth token and handle GET caching / cache invalidation
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const method = config.method?.toLowerCase();
    if (method === 'get') {
      const skipCache = (config as any).skipCache;
      if (!skipCache) {
        const key = getCacheKey(config);
        const cached = getCache.get(key);
        const now = Date.now();
        if (cached && (now - cached.timestamp < 60000)) {
          // Serve from cache
          config.adapter = () => {
            return Promise.resolve({
              data: cached.response.data,
              status: cached.response.status,
              statusText: cached.response.statusText,
              headers: cached.response.headers,
              config,
            } as any);
          };
        }
      }
    } else if (method === 'post' || method === 'put' || method === 'delete' || method === 'patch') {
      // Invalidate cache on mutations
      getCache.clear();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle GET caching and token refresh
api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();
    const skipCache = (response.config as any).skipCache;

    // Only cache successful GET responses
    if (method === 'get' && !skipCache && response.status >= 200 && response.status < 300) {
      const key = getCacheKey(response.config);
      getCache.set(key, {
        response: {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        },
        timestamp: Date.now(),
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data.data;
        
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
