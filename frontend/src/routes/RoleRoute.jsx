import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { CardSkeleton } from '../components/common/LoadingSkeleton';

export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F6F8FA]">
        <div className="w-full max-w-md">
          <CardSkeleton height="h-64" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    // If tutor tries to visit student page -> redirect to tutor dashboard, etc.
    if (user?.role === 'TUTOR') {
      return <Navigate to="/tutor/dashboard" replace />;
    } else if (user?.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/app" replace />;
    }
  }

  return children;
};

export default RoleRoute;
