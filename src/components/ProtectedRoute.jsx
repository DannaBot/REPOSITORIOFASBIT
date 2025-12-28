import React from 'react';
import { Navigate } from 'react-router-dom';
import { getUser } from '../lib/auth';

export default function ProtectedRoute({ role, children }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
