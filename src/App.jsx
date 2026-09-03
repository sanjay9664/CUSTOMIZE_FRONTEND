import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import AppRoutes from './routes/AppRoutes';
import Login from './pages/Login';
import { DeviceStatusProvider } from './services/DeviceStatusContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

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
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DeviceStatusProvider>
          <AppContent />
        </DeviceStatusProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

