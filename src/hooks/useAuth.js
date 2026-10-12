import { useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bootstrapAuth, login as loginAction, logout as logoutAction, syncAuth, fetchCurrentUser } from '../store/authSlice.js';
import { startAutoTokenRefresh, stopAutoTokenRefresh } from '../services/authRefreshService.js';
import { 
  checkPermission as checkPermissionUtil, 
  checkRole as checkRoleUtil, 
  checkFeature as checkFeatureUtil, 
  extractUserPermissions 
} from '../utils/rbac.js';

export { checkRoleUtil as checkRole, checkFeatureUtil as checkFeature, extractUserPermissions };

export const checkPermission = (userOrPermissions, requiredPermission, requiredFeature = null) => {
  // If first arg is an array (legacy signature checkPermission(permissions, required)), adapt it
  if (Array.isArray(userOrPermissions)) {
    return checkPermissionUtil({ permissions: userOrPermissions }, requiredPermission, requiredFeature);
  }
  return checkPermissionUtil(userOrPermissions, requiredPermission, requiredFeature);
};

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  
  const user = auth.user;
  const userRole = auth.userRole || user?.role || 'USER';
  const isSuperAdmin = String(userRole).toUpperCase() === 'SUPER_ADMIN' || Boolean(user?.isRootUser);
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(String(userRole).toUpperCase()) || Boolean(user?.isRootUser);

  const permissions = useMemo(() => extractUserPermissions(user), [user]);
  const features = useMemo(() => user?.features || {}, [user]);
  const accessibleSites = useMemo(() => user?.accessibleSites || [], [user]);
  const scope = useMemo(() => user?.scope || null, [user]);

  const hasPermission = useCallback((code, feature = null) => {
    return checkPermissionUtil(user, code, feature);
  }, [user]);

  const hasRole = useCallback((roles) => {
    return checkRoleUtil(user, roles);
  }, [user]);

  const hasFeature = useCallback((featureKey) => {
    return checkFeatureUtil(user, featureKey);
  }, [user]);

  return {
    ...auth,
    user,
    userRole,
    isSuperAdmin,
    isAdmin,
    permissions,
    features,
    accessibleSites,
    scope,
    login: (credentials) => dispatch(loginAction(credentials)).unwrap().then((result) => ({ success: true, data: result.data })),
    logout: () => {
      dispatch(logoutAction());
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    },
    syncAuthState: () => dispatch(syncAuth()),
    refreshUserProfile: () => dispatch(fetchCurrentUser()),
    hasRole,
    hasPermission,
    hasFeature
  };
};

export default useAuth;
