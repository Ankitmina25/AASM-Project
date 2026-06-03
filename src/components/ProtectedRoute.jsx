import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, user, adminOnly = false }) => {
  const savedUser = localStorage.getItem('user');
  const currentUser = user || (savedUser ? JSON.parse(savedUser) : null);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
