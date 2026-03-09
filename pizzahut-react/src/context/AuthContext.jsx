import React, { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const DEMO_USERS = [
  {
    id: 'admin-001',
    name: 'Administrador Pizza Hut',
    email: 'admin@pizzahut.com',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: 'user-001',
    name: 'Cliente Pizza Hut',
    email: 'user@pizzahut.com',
    password: 'user123',
    role: 'user',
  },
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');

  const login = (email, password) => {
    const foundUser = DEMO_USERS.find(
      (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password,
    );

    if (!foundUser) {
      setCurrentUser(null);
      setError('Credenciales inválidas. Intenta con los usuarios de prueba.');
      return false;
    }

    setCurrentUser({
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role,
    });
    setError('');
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    setError('');
  };

  const value = useMemo(
    () => ({
      currentUser,
      error,
      login,
      logout,
    }),
    [currentUser, error],
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