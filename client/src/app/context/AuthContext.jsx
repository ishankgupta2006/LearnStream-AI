import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await api.getCurrentUser();
          if (response.success && response.user) {
            setUser(response.user);
          } else {
            // Invalid token, clear it
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
          }
        } catch (err) {
          console.error('Failed to restore session:', err);
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const register = async (email, password, name) => {
    setError(null);
    try {
      const response = await api.registerUser(email, password, name);
      
      if (response.success) {
        // Save tokens
        localStorage.setItem('authToken', response.token);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        
        // Set user
        setUser(response.user);
        return { success: true };
      } else {
        setError(response.error || 'Registration failed');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await api.loginUser(email, password);
      
      if (response.success) {
        // Save tokens
        localStorage.setItem('authToken', response.token);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        
        // Set user
        setUser(response.user);
        return { success: true };
      } else {
        setError(response.error || 'Login failed');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = err.message || 'Invalid email or password';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.logoutUser(refreshToken);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Always clear local state
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setError(null);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const response = await api.updateProfile(updates);
      
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Update failed' };
      }
    } catch (err) {
      return { success: false, error: err.message || 'Update failed' };
    }
  };

  const updateStats = (statsUpdate) => {
    if (!user) return;
    
    // Update local user stats (backend updates happen on quiz submit)
    setUser(prev => ({
      ...prev,
      stats: { ...prev.stats, ...statsUpdate }
    }));
  };

  const refreshSession = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await api.refreshToken(refreshToken);
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        return true;
      }
    } catch (err) {
      console.error('Failed to refresh session:', err);
      logout();
    }
    return false;
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        register,
        login,
        logout,
        updateProfile,
        updateStats,
        refreshSession,
        clearError,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
