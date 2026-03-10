import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const COOKIE_USER_ID = 'user_id';
const COOKIE_USER_TYPE = 'user_type';
const COOKIE_USER_NAME = 'user_name';
const COOKIE_USER_EMAIL = 'user_email';
const COOKIE_USER_PHONE = 'user_phone';

const setCookie = (key, value, days = 7) => {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const getCookie = (key) => {
  const prefix = `${key}=`;
  const found = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix));

  if (!found) {
    return '';
  }

  return decodeURIComponent(found.substring(prefix.length));
};

const clearCookie = (key) => {
  document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const storedUserId = getCookie(COOKIE_USER_ID);
    if (storedUserId) {
      const storedEmail = getCookie(COOKIE_USER_EMAIL);
      const storedPhone = getCookie(COOKIE_USER_PHONE);

      if (!storedEmail || !storedPhone) {
        clearCookie(COOKIE_USER_ID);
        clearCookie(COOKIE_USER_TYPE);
        clearCookie(COOKIE_USER_NAME);
        clearCookie(COOKIE_USER_EMAIL);
        clearCookie(COOKIE_USER_PHONE);
        setCurrentUser(null);
        setIsInitializing(false);
        return;
      }

      setCurrentUser({
        id: storedUserId,
        role: getCookie(COOKIE_USER_TYPE) || 'user',
        name: getCookie(COOKIE_USER_NAME) || 'Usuario',
        email: storedEmail,
        phone: storedPhone,
      });
    }
    setIsInitializing(false);
  }, []);

  const login = async (email, password) => {
    setError('');
    try {
      const loginUrl = `${API_BASE_URL}/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      const response = await fetch(loginUrl, {
        method: 'GET',
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        setCurrentUser(null);
        clearCookie(COOKIE_USER_ID);
        clearCookie(COOKIE_USER_TYPE);
        clearCookie(COOKIE_USER_NAME);
        clearCookie(COOKIE_USER_EMAIL);
        clearCookie(COOKIE_USER_PHONE);
        setError(payload?.detail || payload?.message || 'Credenciales inválidas.');
        return false;
      }

      if (Array.isArray(payload) && payload.length > 1 && Number(payload[1]) >= 400) {
        setCurrentUser(null);
        clearCookie(COOKIE_USER_ID);
        clearCookie(COOKIE_USER_TYPE);
        clearCookie(COOKIE_USER_NAME);
        clearCookie(COOKIE_USER_EMAIL);
        clearCookie(COOKIE_USER_PHONE);
        setError(payload[0]?.message || 'Credenciales inválidas.');
        return false;
      }

      const userId = payload?.User_id || payload?.user_id || payload?._id;
      const backendType = payload?.user_type || payload?.role || 'Consumer';
      const userName = payload?.user_name || payload?.name || 'Usuario';
      const userEmail = payload?.email || payload?.Email || email || '';
      const userPhone = payload?.phone || payload?.Phone || '';
      const mappedRole = String(backendType).toLowerCase() === 'admin' ? 'admin' : 'user';

      if (!userId) {
        setCurrentUser(null);
        clearCookie(COOKIE_USER_ID);
        clearCookie(COOKIE_USER_TYPE);
        clearCookie(COOKIE_USER_NAME);
        clearCookie(COOKIE_USER_EMAIL);
        clearCookie(COOKIE_USER_PHONE);
        setError('Credenciales inválidas.');
        return false;
      }

      setCookie(COOKIE_USER_ID, userId);
      setCookie(COOKIE_USER_TYPE, mappedRole);
      setCookie(COOKIE_USER_NAME, userName);
      setCookie(COOKIE_USER_EMAIL, userEmail);
      setCookie(COOKIE_USER_PHONE, userPhone);

      setCurrentUser({
        id: userId,
        name: userName,
        role: mappedRole,
        email: userEmail,
        phone: userPhone,
      });

      return true;
    } catch {
      setCurrentUser(null);
      clearCookie(COOKIE_USER_ID);
      clearCookie(COOKIE_USER_TYPE);
      clearCookie(COOKIE_USER_NAME);
      clearCookie(COOKIE_USER_EMAIL);
      clearCookie(COOKIE_USER_PHONE);
      setError('No se pudo conectar con el backend.');
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setError('');
    clearCookie(COOKIE_USER_ID);
    clearCookie(COOKIE_USER_TYPE);
    clearCookie(COOKIE_USER_NAME);
    clearCookie(COOKIE_USER_EMAIL);
    clearCookie(COOKIE_USER_PHONE);
  };

  const value = useMemo(
    () => ({
      currentUser,
      error,
      isInitializing,
      login,
      logout,
    }),
    [currentUser, error, isInitializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}