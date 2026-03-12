import React, { createContext, useContext, useEffect, useState } from 'react';
import authService from '@/services/auth.service';
import { hasAuthToken, clearAuthTokens } from '@/services/api';

// ========================================
// TIPOS
// ========================================
type AppRole = 'admin' | 'courier';

interface User {
  id: string;
  email: string;
  full_name: string;
}

interface AuthContextTestType {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isCourier: boolean;
}

// ========================================
// CREAR CONTEXTO
// ========================================
const AuthContextTest = createContext<AuthContextTestType | undefined>(undefined);

// ========================================
// AUTH PROVIDER
// ========================================
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Limpia datos de Supabase del localStorage
   */
  const cleanSupabaseData = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
  };

  /**
   * Obtiene el rol del usuario desde el backend
   */
  const fetchUserRole = async (userId: string): Promise<AppRole | null> => {
    try {
      const userRole = await authService.getUserRole(userId);
      return userRole;
    } catch (error) {
      console.error('Error fetching role:', error);
      return null;
    }
  };

  /**
   * Obtiene el perfil del usuario actual
   */
  const fetchUserProfile = async (): Promise<boolean> => {
    try {
      // getProfile retorna { user: User }
      const { user: userData } = await authService.getProfile();
      
      setUser(userData);
      
      // Buscar el rol del usuario
      const userRole = await fetchUserRole(userData.id);
      setRole(userRole); 
      
      return true;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
      setRole(null);
      clearAuthTokens();
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * useEffect - Se ejecuta al montar el componente
   */
  useEffect(() => { 
    cleanSupabaseData();

    if (hasAuthToken()) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Iniciar sesión
   */
  const signIn = async (email: string, password: string) => {
    try {
      // login retorna { user: User, token: string }
      const { user: userData } = await authService.login({ email, password });
      console.log('Login response:', userData);
      
      setUser(userData);
      
      // Obtener rol del usuario
      //const userRole = await fetchUserRole(userData.id);
      setRole(userData.role);

      return { error: null };
    } catch (error: any) {
      console.error('Error signing in:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Error al iniciar sesión';
      
      return { 
        error: new Error(errorMessage) 
      };
    }
  };

  /**
   * Registrar nuevo usuario
   */
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // register retorna { user: User, token: string }
      const { user: userData } = await authService.register({
        email,
        password,
        full_name: fullName,
      });

      if (userData) {
        setUser(userData);
        
        const userRole = await fetchUserRole(userData.id);
        setRole(userRole);
      }

      return { error: null };
    } catch (error: any) {
      console.error('Error signing up:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Error al registrarse';
      
      return { 
        error: new Error(errorMessage) 
      };
    }
  };

  /**
   * Cerrar sesión
   */
  const signOut = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      cleanSupabaseData();
      setUser(null);
      setRole(null);
    }
  };

  /**
   * Valor del contexto que se compartirá
   */
  const value = {
    user,
    role,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: role === 'admin',
    isCourier: role === 'courier',
  };

  return <AuthContextTest.Provider value={value}>{children}</AuthContextTest.Provider>;
}

/**
 * Hook personalizado para usar el AuthContext
 */
export function useAuth() {
  const context = useContext(AuthContextTest);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}