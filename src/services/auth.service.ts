import api, { setAuthTokens, clearAuthTokens } from './api';

// ========================================
// TIPOS - Simplificados y claros
// ========================================

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role?: 'admin' | 'courier';
}

// Respuesta del backend para login
interface LoginBackendResponse {
  data: {
    user: User;
    token: string;
    refresh_token?: string;
  };
}

// Respuesta del backend para /auth/me
interface ProfileBackendResponse {
  data: User;
}

// Respuesta del backend para rol
interface RoleBackendResponse {
  data: {
    role: 'admin' | 'courier' | null;
  };
}

// ========================================
// SERVICIO DE AUTENTICACIÓN
// ========================================

export const authService = {
  /**
   * Iniciar sesión
   * POST /auth/login
   */
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<LoginBackendResponse>('/auth/login', credentials);
    
    // response.data.data contiene { user, token, refresh_token }
    const { token, refresh_token } = response.data.data;
    
    // Guardar tokens en localStorage
    setAuthTokens(token, refresh_token);
    
    // Retornar solo lo que necesitas
    return {
      user: response.data.data.user,
      token: response.data.data.token,
    };
  },

  /**
   * Registrar nuevo usuario
   * POST /auth/register
   */
  register: async (userData: RegisterData) => {
    const response = await api.post<LoginBackendResponse>('/auth/register', userData);
    
    // Si el backend hace auto-login (retorna token)
    if (response.data.data.token) {
      setAuthTokens(response.data.data.token, response.data.data.refresh_token);
    }
    
    return {
      user: response.data.data.user,
      token: response.data.data.token,
    };
  },

  /**
   * Cerrar sesión
   * POST /auth/logout
   */
  logout: async (): Promise<void> => {

    clearAuthTokens()
    /**
     * 
     
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error en logout (no crítico):', error);
    } finally {
      clearAuthTokens();
    }
      */
  },

  /**
   * Obtener perfil del usuario actual
   * GET /auth/me
   */
  getProfile: async () => {
    const response = await api.get<ProfileBackendResponse>('/auth/me');
    
    // response.data.data contiene el User
    return {
      user: response.data.data,
    };
  },

  /**
   * Obtener rol específico del usuario
   * GET /auth/me
   */
  getUserRole: async (userId: string): Promise<'admin' | 'courier' | null> => {
    try {
      const response = await api.get<RoleBackendResponse>('/auth/me');
      return response.data.data.role;
    } catch (error) {
      console.error('Error obteniendo rol del usuario:', error);
      return null;
    }
  },

  /**
   * Refrescar token de acceso
   * POST /auth/refresh
   */
  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
    
    setAuthTokens(response.data.token, response.data.refresh_token);
    
    return {
      access_token: response.data.token,
      refresh_token: response.data.refresh_token,
    };
  },
};

export default authService;