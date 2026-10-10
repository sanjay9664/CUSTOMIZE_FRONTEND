import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bootstrapAuth, login as loginAction, logout as logoutAction, syncAuth } from '../store/authSlice.js';
import { startAutoTokenRefresh, stopAutoTokenRefresh } from '../services/authRefreshService.js';

export const checkPermission = (resolvedPermissions = [], requiredPermission) => {
  if (!requiredPermission) return true;
  if (!Array.isArray(resolvedPermissions) || resolvedPermissions.length === 0) return false;
  if (resolvedPermissions.includes('*')) return true;
  if (resolvedPermissions.includes(requiredPermission)) return true;
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

export default useAuth;
