import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => api.getUser());
  const [token, setToken] = useState(() => api.getToken());
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    if (!api.getToken()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      if (response && response.user) {
        setUser(response.user);
        api.setUser(response.user);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      api.clearAuth();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = useCallback(async (identifier, password, userType = null) => {
    const payload = { identifier, password };
    if (userType) payload.user_type = userType;
    const response = await api.post('/auth/login', payload);
    if (response.token && response.user) {
      api.setToken(response.token);
      api.setUser(response.user);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    }
    throw new Error('Respons login tidak valid.');
  }, []);

  const registerStudent = useCallback(async (nim, password, passwordConfirmation) => {
    const response = await api.post('/auth/register-student', {
      nim,
      password,
      password_confirmation: passwordConfirmation,
    });
    if (response.token && response.user) {
      api.setToken(response.token);
      api.setUser(response.user);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    }
    throw new Error('Registrasi mahasiswa gagal.');
  }, []);

  const registerGeneral = useCallback(async (formData) => {
    const response = await api.post('/auth/register-general', formData);
    if (response.token && response.user) {
      api.setToken(response.token);
      api.setUser(response.user);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    }
    throw new Error('Pendaftaran pengguna umum gagal.');
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Logout request failed or expired:', e);
    } finally {
      api.clearAuth();
      setUser(null);
      setToken(null);
      window.location.href = '/';
    }
  }, []);

  const isStudent = user?.role === 'STUDENT';
  const isGeneral = user?.role === 'GENERAL';
  const isTutor = user?.role === 'TUTOR';
  const isAdmin = user?.role === 'ADMIN';
  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isStudent,
        isGeneral,
        isTutor,
        isAdmin,
        login,
        registerStudent,
        registerGeneral,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
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
