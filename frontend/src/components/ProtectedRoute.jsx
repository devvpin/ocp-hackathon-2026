import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, loading, revalidate } = useAuth();
  const navigate = useNavigate();
  // Re-validate auth when the page is restored from bfcache (back/forward navigation)
  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        // Page was restored from bfcache — re-check authentication
        revalidate().catch(() => {
          navigate('/auth/login', { replace: true });
        });
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [revalidate, navigate]);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin-slow" />
          <span className="text-sm text-surface-500 font-medium">Loading...</span>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/pos" replace />;
  }
  return children;
}