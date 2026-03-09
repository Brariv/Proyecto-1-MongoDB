import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginScreen from './Screens/LoginScreen';
import UserDashboard from './Screens/UserDashboard';

export default function App() {
  const { currentUser, logout } = useAuth();

  if (!currentUser) {
    return <LoginScreen />;
  }

  if (currentUser.role === 'user') {
    return <UserDashboard onLogout={logout} user={currentUser} />;
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <img src="/logo.png" alt="Pizza Hut" className="brand-logo" />
        <h1 className="brand-title">Panel administrativo</h1>
        <p className="success-text">Sesión iniciada como {currentUser.name}</p>
        <p className="role-badge">Rol: {currentUser.role}</p>
        <button className="login-button" onClick={logout} type="button">
          Cerrar sesión
        </button>
      </section>
    </main>
  );
}