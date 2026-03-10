import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginScreen from './Screens/LoginScreen';
import AdminDashboard from './Screens/AdminDashboard';
import UserDashboard from './Screens/UserDashboard';

export default function App() {
  const { currentUser, logout, isInitializing } = useAuth();

  if (isInitializing) {
    return null;
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  if (currentUser.role === 'admin') {
    return <AdminDashboard onLogout={logout} user={currentUser} />;
  }

  return <UserDashboard onLogout={logout} user={currentUser} />;
}