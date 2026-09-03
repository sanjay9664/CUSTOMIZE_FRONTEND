import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getAuthToken,
  getUserRole,
  getUserData,
  setAuthSession,
  clearAuthSession,
  getCookie
} from '../utils/cookieUtils';
import { performTokenRefresh } from '../services/authRefreshService';

import { AUTH_ENDPOINTS } from '../utils/apiConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getUserData());
  const [userRole, setUserRole] = useState(() => getUserRole() || 'USER');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!(getAuthToken() || getCookie('isAuthenticated') === 'true' || localStorage.getItem('isAuthenticated') === 'true');
  });
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize state with current cookies & storage
  const syncAuthState = useCallback(() => {
    const token = getAuthToken();
    const hasAuthCookie = !!(token || getCookie('isAuthenticated') === 'true');
    const hasLocalAuth = localStorage.getItem('isAuthenticated') === 'true';
    const isAuthed = hasAuthCookie || hasLocalAuth;

    setIsAuthenticated(isAuthed);
    if (isAuthed) {
      setUser(getUserData());
      setUserRole(getUserRole() || 'USER');
    } else {
      setUser(null);
      setUserRole('USER');
    }
  }, []);

  // Silent session boot check on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAuthToken();
      const hasRefresh = !!getCookie('refresh_token') || !!localStorage.getItem('refresh_token');

      if (!token && hasRefresh) {
        // Attempt silent refresh on startup
        try {
          const freshToken = await performTokenRefresh();
          if (freshToken) {
            syncAuthState();
          } else {
            clearAuthSession();
            syncAuthState();
          }
        } catch {
          syncAuthState();
        }
      } else {
        syncAuthState();
      }
      setIsLoading(false);
    };

    initializeAuth();

    // React to tab visibility, window focus, and cross-tab storage changes
    window.addEventListener('storage', syncAuthState);
    document.addEventListener('visibilitychange', syncAuthState);
    window.addEventListener('focus', syncAuthState);

    return () => {
      window.removeEventListener('storage', syncAuthState);
      document.removeEventListener('visibilitychange', syncAuthState);
      window.removeEventListener('focus', syncAuthState);
    };
  }, [syncAuthState]);

  // Login handler
  const login = useCallback(async ({ identifier, password }) => {
    const payload = {
      identifier,
      email: identifier,
      password
    };

    let response;
    try {
      response = await fetch(AUTH_ENDPOINTS.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (networkErr) {
      throw new Error(`Unable to connect to authentication server at ${AUTH_ENDPOINTS.login}. Please verify your backend server is running.`);
    }

    if (response && response.ok) {
      const resData = await response.json();
      const payloadData = resData?.data || resData;
      const loggedUser = payloadData?.user || {};
      const token = payloadData?.accessToken || payloadData?.token || '';
      const refreshToken = payloadData?.refreshToken || '';
      const role = loggedUser.role || 'ADMIN';

      setAuthSession({
        token,
        refreshToken,
        userRole: role,
        userData: loggedUser
      });

      setUser(loggedUser);
      setUserRole(role);
      setIsAuthenticated(true);

      return { success: true, data: payloadData };
    }

    let errorMsg = 'Invalid username/email or password';
    try {
      const errData = await response.json();
      errorMsg = errData?.error?.message || errData?.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
    setUserRole('USER');
    setIsAuthenticated(false);
    if (typeof window !== 'undefined' && window.location && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }, []);

  // Role verification helper
  const hasRole = useCallback((allowedRoles) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    const current = (userRole || '').toUpperCase();
    return allowedRoles.some(r => r.toUpperCase() === current);
  }, [userRole]);

  const value = {
    user,
    userRole,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasRole,
    syncAuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
