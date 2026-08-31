import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import AppRoutes from './routes/AppRoutes';
import Login from './pages/Login';
import { DeviceStatusProvider } from './services/DeviceStatusContext';
import { ThemeProvider } from './context/ThemeContext';

import { getCookie, clearAuthCookies, setAuthCookies } from './utils/cookieUtils';
import { startAutoTokenRefresh, stopAutoTokenRefresh } from './services/authRefreshService';

function App() {
  const getInitialAuthStatus = () => {
    const hasLocalAuth = localStorage.getItem('isAuthenticated') === 'true';
    const hasAuthCookie = !!(getCookie('access_token') || getCookie('token') || getCookie('isAuthenticated'));
    return hasLocalAuth && hasAuthCookie;
  };

  const [isAuthenticated, setIsAuthenticated] = useState(getInitialAuthStatus);


  // Listen for cookie deletion & storage changes (Redirects to /login if cookies are deleted)
  useEffect(() => {
    const checkAuth = () => {
      const hasLocalAuth = localStorage.getItem('isAuthenticated') === 'true';
      const hasAuthCookie = !!(getCookie('access_token') || getCookie('token') || getCookie('isAuthenticated'));

      // If user deleted cookies in DevTools OR auth state was cleared
      if (hasLocalAuth && !hasAuthCookie) {
        console.warn('Authentication cookies deleted/missing. Purging session & redirecting to /login...');
        clearAuthCookies();
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userData');
        localStorage.removeItem('userRole');
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(hasLocalAuth && hasAuthCookie);
    };

    window.addEventListener('storage', checkAuth);
    // Continuously monitor cookie status every 500ms
    const interval = setInterval(checkAuth, 500);
    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(interval);
    };
  }, []);

  // Auto token refresh manager (Refreshes token 2 mins before 15-min expiry / Every 13 minutes)
  useEffect(() => {
    if (isAuthenticated) {
      startAutoTokenRefresh();
    } else {
      stopAutoTokenRefresh();
    }
    return () => {
      stopAutoTokenRefresh();
    };
  }, [isAuthenticated]);

  return (
    <ThemeProvider>
      <DeviceStatusProvider>
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
                  <MainLayout>
                    <AppRoutes />
                  </MainLayout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </Router>
      </DeviceStatusProvider>
    </ThemeProvider>
  );
}

export default App;

