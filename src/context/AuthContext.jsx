import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bootstrapAuth, login as loginAction, logout as logoutAction, syncAuth } from '../store/authSlice';
import { startAutoTokenRefresh, stopAutoTokenRefresh } from '../services/authRefreshService';

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    dispatch(bootstrapAuth());
    // Only sync on cross-tab storage changes, NOT on window focus:
    // focus fires syncAuth() which re-reads localStorage and can see a stale/missing
    // isAuthenticated flag, causing a spurious logout when switching tabs.
    // The authRefreshService already checks token expiry on visibilitychange/focus.
    const sync = () => dispatch(syncAuth());
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('storage', sync);
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
export const checkPermission = (resolvedPermissions = [], requiredPermission) => {
  if (!requiredPermission) return true;
  if (!Array.isArray(resolvedPermissions) || resolvedPermissions.length === 0) return false;
  // 1. Wildcard '*' grants full access to all actions
  if (resolvedPermissions.includes('*')) return true;
  // 2. Exact code matching (e.g. 'user:read')
  if (resolvedPermissions.includes(requiredPermission)) return true;
  // 3. Module wildcard '<module>:*' (e.g. 'user:*' grants 'user:read', 'user:write')
  const [module] = requiredPermission.split(':');
  if (module && resolvedPermissions.includes(`${module}:*`)) return true;
  return false;
};

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const permissions = auth.user?.resolvedPermissions || auth.user?.permissions || [];

  return {
    ...auth,
    login: (credentials) => dispatch(loginAction(credentials)).unwrap().then((result) => ({ success: true, data: result.data })),
    logout: () => {
      dispatch(logoutAction());
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    },
    syncAuthState: () => dispatch(syncAuth()),
    hasRole: (roles) => !roles?.length || roles.some((role) => role.toUpperCase() === auth.userRole?.toUpperCase()),
    hasPermission: (code) => checkPermission(permissions, code)
  };
};
