import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// ========================================
// CONFIGURACIÓN
// ========================================
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';;

// ========================================
// INSTANCIA DE AXIOS
// ========================================
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ========================================
// INTERCEPTOR DE REQUEST (agregar token)
// ========================================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ========================================
// INTERCEPTOR DE RESPONSE (manejo de errores)
// ========================================
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<{ error?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Manejo de token expirado (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      
      // Si hay refresh token, intentar renovar
      if (refreshToken) {
        try {
          console.log('Esta intentano hacer esto')
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          // Guardar nuevo token
          localStorage.setItem('access_token', data.access_token);
          if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
          }
          
          // Reintentar la petición original con el nuevo token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          }
          
          return api(originalRequest);
        } catch (refreshError) {
          // Si falla el refresh, limpiar todo y redirigir al login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          
          // Redirigir al login
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
          
          return Promise.reject(refreshError);
        }
      } else {
        // No hay refresh token, limpiar y redirigir
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
    }

    // Logging de errores en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.response?.data?.error || error.message,
      });
    }

    return Promise.reject(error);
  }
);

// ========================================
// HELPERS PARA TOKENS
// ========================================

/**
 * Guarda los tokens en localStorage
 */
export const setAuthTokens = (token: string, refreshToken?: string) => {
  localStorage.setItem('access_token', token);
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }
};

/**
 * Limpia los tokens del localStorage
 */
export const clearAuthTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

/**
 * Obtiene el token de acceso actual
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem('access_token');
};

/**
 * Obtiene el refresh token
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

/**
 * Verifica si hay un token guardado
 */
export const hasAuthToken = (): boolean => {
  return !!getAccessToken();
};

/**
 * Decodifica el payload del JWT (sin verificar firma)
 * Útil para obtener información como userId o expiración
 */
export const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Verifica si el token está expirado
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  // exp viene en segundos, Date.now() en milisegundos
  return decoded.exp * 1000 < Date.now();
};

export default api;