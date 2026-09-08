import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bootstrapAuth, login as loginAction, logout as logoutAction, syncAuth } from '../store/authSlice';
import { startAutoTokenRefresh, stopAutoTokenRefresh } from '../services/authRefreshService';

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    dispatch(bootstrapAuth());
    const sync = () => dispatch(syncAuth());
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      stopAutoTokenRefresh();
      return undefined;
    }

    startAutoTokenRefresh();
    return stopAutoTokenRefresh;
  }, [isAuthenticated]);

  return children;
};
export const useAuth = () => { const dispatch = useDispatch(); const auth = useSelector((state) => state.auth); return { ...auth, login: (credentials) => dispatch(loginAction(credentials)).unwrap().then((result) => ({ success: true, data: result.data })), logout: () => { dispatch(logoutAction()); if (location.pathname !== '/login') location.href = '/login'; }, syncAuthState: () => dispatch(syncAuth()), hasRole: (roles) => !roles?.length || roles.some((role) => role.toUpperCase() === auth.userRole?.toUpperCase()) }; };
