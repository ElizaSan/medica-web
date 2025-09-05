import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          const response = await authService.verifyToken();
          if (response.success) {
            setUser(response.data.usuario);
            setIsAuthenticated(true);
          } else {
            logout();
          }
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authService.login(credentials);
      
      if (response.success) {
        const { token, usuario } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(usuario));
        
        setUser(usuario);
        setIsAuthenticated(true);
        
        toast.success('Inicio de sesión exitoso');
        return { success: true };
      } else {
        toast.error(response.message || 'Error en el inicio de sesión');
        return { success: false, message: response.message };
      }
    } catch (error) {
      toast.error('Error en el inicio de sesión');
      return { success: false, message: 'Error en el inicio de sesión' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      
      if (response.success) {
        const { token, usuario } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(usuario));
        
        setUser(usuario);
        setIsAuthenticated(true);
        
        toast.success('Registro exitoso');
        return { success: true };
      } else {
        toast.error(response.message || 'Error en el registro');
        return { success: false, message: response.message };
      }
    } catch (error) {
      toast.error('Error en el registro');
      return { success: false, message: 'Error en el registro' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Sesión cerrada');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 