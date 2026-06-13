import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/pos" replace />;
  }

  return children;
};

export default AdminRoute;
