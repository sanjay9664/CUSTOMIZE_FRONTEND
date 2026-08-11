import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import AppRoutes from './routes/AppRoutes';
import Login from './pages/Login';
import { DeviceStatusProvider } from './services/DeviceStatusContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );

  // Auto-login from URL parameters (useful for iframe embedding)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const urlRole = urlParams.get('role');
    
    if (urlToken) {
      localStorage.setItem('token', urlToken);
      localStorage.setItem('isAuthenticated', 'true');
      if (urlRole) localStorage.setItem('userRole', urlRole);
      
      // Default sidebar config for bypass
      const sidebarMapping = {
        "Dashboard": true,
        "Water Management": true,
        "Motors": true,
        "DG Set": true,
        "Setting Templates": true,
        "Alarm System": true,
        "LT Panel": true,
        "Transformer": true,
        "Fire": true,
        "Ticketing": true,
        "Maintenance": true,
        "Service History": true,
        "Daily DPR": true,
        "Energy Metering": true
      };
      localStorage.setItem('scada_modules_config', JSON.stringify(sidebarMapping));
      
      setIsAuthenticated(true);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Listen for storage changes (for login/logout across tabs if needed)
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(localStorage.getItem('isAuthenticated') === 'true');
    };
    window.addEventListener('storage', checkAuth);
    // Periodically check local storage status to synchronize within the same tab
    const interval = setInterval(checkAuth, 500);
    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(interval);
    };
  }, []);

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

