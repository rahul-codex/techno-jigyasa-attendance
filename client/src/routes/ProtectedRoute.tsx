import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ProtectedRoute = ({
  children,
  requireCompleteProfile = true,
}: {
  children: ReactElement;
  requireCompleteProfile?: boolean;
}) => {
  const { isAuthenticated, isLoading, role, isProfileComplete } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Verifying session..." />
      </div>
    );
  }

  // Not logged in or not a student -> redirect to login
  if (!isAuthenticated || role !== 'STUDENT') {
    return <Navigate to="/student/login" state={{ from: location }} replace />;
  }

  const isSetupRoute = location.pathname === '/student/profile/setup';

  // Incomplete profile: must complete profile first
  if (!isProfileComplete && requireCompleteProfile && !isSetupRoute) {
    return <Navigate to="/student/profile/setup" replace />;
  }

  // Complete profile trying to access /student/profile/setup -> redirect to dashboard
  if (isProfileComplete && isSetupRoute) {
    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
};
