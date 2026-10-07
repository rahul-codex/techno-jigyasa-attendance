import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const AdminProtectedRoute = ({ children }: { children: ReactElement }) => {
  const { isAuthenticated, isLoading, role } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Verifying admin credentials..." />
      </div>
    );
  }

  // If not authenticated or not an authorized admin role, redirect to admin login
  if (!isAuthenticated || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};
