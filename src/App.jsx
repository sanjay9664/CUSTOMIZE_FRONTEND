import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SiteProvider } from './context/SiteContext';

// Keep the login bundle small. The authenticated application is downloaded
// only after a valid session is available.
const MainLayout = lazy(() => import('./layout/MainLayout'));
const AppRoutes = lazy(() => import('./routes/AppRoutes'));

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
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

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SiteProvider>
          <DeviceStatusProvider>
            <AppContent />
          </DeviceStatusProvider>
        </SiteProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

