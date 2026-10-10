import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Login from './pages/Login';
import { useAuth } from './hooks/useAuth.js';
import { useThemeEffect } from './hooks/useTheme.js';
import { bootstrapAuth, syncAuth } from './store/authSlice.js';
import { fetchSitesThunk } from './store/siteSlice.js';
import { startAutoTokenRefresh, stopAutoTokenRefresh } from './services/authRefreshService.js';
import { getAuthToken } from './utils/cookieUtils.js';

const MainLayout = lazy(() => import('./layout/MainLayout'));
const AppRoutes = lazy(() => import('./routes/AppRoutes'));

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, isBootstrapping, isLoading } = useAuth();
  useThemeEffect();

  // Bootstrap authentication and sites on initial load
  useEffect(() => {
    dispatch(bootstrapAuth());

    const sync = () => dispatch(syncAuth());
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('storage', sync);
    };
  }, [dispatch]);

  // Manage auto token refresh lifecycle based on auth state
  useEffect(() => {
    if (!isAuthenticated) {
      stopAutoTokenRefresh();
      return undefined;
    }

    startAutoTokenRefresh();
    return stopAutoTokenRefresh;
  }, [isAuthenticated]);

  // Load and refresh sites on auth change
  useEffect(() => {
    if (getAuthToken()) {
      dispatch(fetchSitesThunk());
    }

    const handleAuthRefreshed = () => {
      dispatch(fetchSitesThunk());
    };

    window.addEventListener('bms_auth_refreshed', handleAuthRefreshed);
    window.addEventListener('storage-update', handleAuthRefreshed);
    return () => {
      window.removeEventListener('bms_auth_refreshed', handleAuthRefreshed);
      window.removeEventListener('storage-update', handleAuthRefreshed);
    };
  }, [dispatch, isAuthenticated]);

  // Handle browser back/forward cache restore
  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted && !isAuthenticated) {
        window.location.replace('/login');
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [isAuthenticated]);

  if (isBootstrapping ?? isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-dark text-white">
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* LOGIN ROUTE */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} 
        />

        {/* PROTECTED ROUTES */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Suspense fallback={<div className="d-flex align-items-center justify-content-center min-vh-100 bg-dark text-white"><div className="spinner-border text-info" role="status" /></div>}>
                <MainLayout>
                  <AppRoutes />
                </MainLayout>
              </Suspense>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

