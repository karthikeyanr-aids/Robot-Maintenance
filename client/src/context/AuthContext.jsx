import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('robocare_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Clear legacy localStorage auth keys if present
      localStorage.removeItem('robocare_token');
      localStorage.removeItem('robocare_user');

      const storedToken = sessionStorage.getItem('robocare_token');
      const storedUser = sessionStorage.getItem('robocare_user');

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error('Failed to parse cached user');
          }
        }
        try {
          const res = await authAPI.getMe();
          if (res.data.success) {
            setUser(res.data.user);
            sessionStorage.setItem('robocare_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    const res = await authAPI.login({ identifier, email: identifier, username: identifier, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      sessionStorage.setItem('robocare_token', res.data.token);
      sessionStorage.setItem('robocare_user', JSON.stringify(res.data.user));
      return res.data;
    }
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      sessionStorage.setItem('robocare_token', res.data.token);
      sessionStorage.setItem('robocare_user', JSON.stringify(res.data.user));
      return res.data;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('robocare_token');
    sessionStorage.removeItem('robocare_user');
    localStorage.removeItem('robocare_token');
    localStorage.removeItem('robocare_user');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    sessionStorage.setItem('robocare_user', JSON.stringify(updatedUser));
  };

  const hasRole = (...roles) => {
    return user && roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, hasRole, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
