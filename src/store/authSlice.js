import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getAuthToken, getRefreshToken, getUserData, getUserRole, clearAuthSession, setAuthSession, getCookie, isTokenExpiringSoon } from '../utils/cookieUtils.js';
import { performTokenRefresh, startAutoTokenRefresh, stopAutoTokenRefresh } from '../services/authRefreshService.js';
import { AUTH_ENDPOINTS } from '../utils/apiConfig.js';

const sanitizeUserData = (rawUser) => {
  if (!rawUser || typeof rawUser !== 'object') return null;
  // Strip sensitive credentials if backend inadvertently returned them
  const { password, hash, salt, secret, token, refreshToken, ...safeUser } = rawUser;
  return safeUser;
};

const getSafeSession = () => {
  try {
    const hasToken = Boolean(getAuthToken());
    const isAuthFlag = typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') === 'true';
    const isAuthenticated = hasToken || isAuthFlag;
    return {
      isAuthenticated,
      user: isAuthenticated ? sanitizeUserData(getUserData()) : null,
      userRole: isAuthenticated ? (getUserRole() || 'USER') : 'USER'
    };
  } catch {
    return { isAuthenticated: false, user: null, userRole: 'USER' };
  }
};

import { bmsService } from '../services/bmsService.js';

export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const res = await bmsService.getCurrentUser();
    const profile = res?.data?.data || res?.data || res;
    if (!profile) return rejectWithValue('No user profile received');
    const cleanUser = sanitizeUserData(profile);
    const userRole = cleanUser.role || 'USER';
    setAuthSession({
      token: getAuthToken() || '',
      refreshToken: getRefreshToken() || '',
      userRole,
      userData: cleanUser
    });
    return { user: cleanUser, userRole };
  } catch (err) {
    return rejectWithValue(err?.message || 'Failed to fetch current user profile');
  }
});

export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  const token = getAuthToken();
  const refreshToken = getRefreshToken();
  if (token || refreshToken) {
    if (!token || isTokenExpiringSoon(token, 180)) {
      await performTokenRefresh();
    }
  }
  let session = getSafeSession();
  if (session.isAuthenticated) {
    startAutoTokenRefresh();
    try {
      // Fetch fresh profile and dynamic permissions directly from /api/v1/auth/me
      const profileRes = await bmsService.getCurrentUser();
      const profile = profileRes?.data?.data || profileRes?.data || profileRes;
      if (profile && (profile.id || profile.email || profile.name)) {
        const cleanUser = sanitizeUserData(profile);
        const userRole = cleanUser.role || session.userRole || 'USER';
        setAuthSession({
          token: getAuthToken() || '',
          refreshToken: getRefreshToken() || '',
          userRole,
          userData: cleanUser
        });
        session = {
          isAuthenticated: true,
          user: cleanUser,
          userRole
        };
      }
    } catch (e) {
      console.warn('[authSlice] bootstrap /auth/me notice (using cached session):', e?.message);
    }
  }
  return session;
});

export const login = createAsyncThunk('auth/login', async ({ identifier, password, rememberMe }, { rejectWithValue }) => {
  const cleanId = typeof identifier === 'string' ? identifier.trim() : '';
  if (!cleanId || !password) {
    return rejectWithValue('Please enter both username/email and password.');
  }

  try {
    const payload = { identifier: cleanId, email: cleanId, password };
    if (rememberMe) {
      payload.rememberMe = true;
    }

    const response = await fetch(AUTH_ENDPOINTS.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    let result = null;
    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (!response.ok) {
      if (response.status >= 500) {
        return rejectWithValue('Technical issue. Please contact the team.');
      }
      const msg = result?.error?.message 
        || (typeof result?.error === 'string' ? result.error : null) 
        || result?.message 
        || result?.error?.code 
        || 'Invalid email or password';
      return rejectWithValue(msg);
    }

    if (result && result.success === false) {
      const msg = result?.error?.message 
        || (typeof result?.error === 'string' ? result.error : null) 
        || result?.message 
        || 'Invalid email or password';
      return rejectWithValue(msg);
    }

    const data = result?.data?.data || result?.data || result;
    const initialUser = sanitizeUserData(data?.user) || {};
    let finalUser = initialUser;
    let finalRole = initialUser.role || 'ADMIN';

    // Persist securely to cookie, localStorage, & memory token session
    setAuthSession({
      token: data?.accessToken || data?.token || '',
      refreshToken: data?.refreshToken || '',
      userRole: finalRole,
      userData: initialUser
    });

    // Enrich immediately from /api/v1/auth/me to fetch resolvedPermissions, accessibleSites, scope & features
    try {
      const profileRes = await bmsService.getCurrentUser();
      const profile = profileRes?.data?.data || profileRes?.data || profileRes;
      if (profile && (profile.id || profile.email || profile.name)) {
        finalUser = sanitizeUserData({ ...initialUser, ...profile });
        finalRole = finalUser.role || finalRole;
        setAuthSession({
          token: data?.accessToken || data?.token || getAuthToken() || '',
          refreshToken: data?.refreshToken || getRefreshToken() || '',
          userRole: finalRole,
          userData: finalUser
        });
      }
    } catch (profileErr) {
      console.warn('[authSlice] login /auth/me enrichment deferred:', profileErr?.message);
    }

    return { user: finalUser, userRole: finalRole, data };
  } catch (err) {
    return rejectWithValue('Technical issue. Please contact the team.');
  }
});

const initialState = {
  ...getSafeSession(),
  'Sochiot-accesstoken': typeof localStorage !== 'undefined' ? localStorage.getItem('Sochiot-accesstoken') : null,
  isBootstrapping: true,
  isLoading: false,
  error: null
};

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    syncAuth: (state) => {
      const current = getSafeSession();
      state.isAuthenticated = current.isAuthenticated;
      state.user = current.user;
      state.userRole = current.userRole;
    },
    setSession: (state, action) => {
      state.isAuthenticated = true;
      state.user = sanitizeUserData(action.payload?.user) || state.user;
      state.userRole = action.payload?.userRole || state.userRole || 'USER';
      state.error = null;
    },
    setSochiotAccessToken: (state, action) => {
      state['Sochiot-accesstoken'] = action.payload || null;
      try {
        if (typeof localStorage !== 'undefined') {
          if (action.payload) {
            localStorage.setItem('Sochiot-accesstoken', action.payload);
          } else {
            localStorage.removeItem('Sochiot-accesstoken');
          }
        }
      } catch (e) {}
    },
    logout: (state) => {
      stopAutoTokenRefresh();
      clearAuthSession();
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('Sochiot-accesstoken');
        }
      } catch (e) {}
      state['Sochiot-accesstoken'] = null;
      state.isAuthenticated = false;
      state.user = null;
      state.userRole = 'USER';
      state.error = null;
      state.isLoading = false;
      state.isBootstrapping = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.pending, (state) => {
        state.isBootstrapping = true;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.isAuthenticated = Boolean(action.payload?.isAuthenticated);
        state.user = action.payload?.user || null;
        state.userRole = action.payload?.userRole || 'USER';
        state.isBootstrapping = false;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        const current = getSafeSession();
        state.isAuthenticated = current.isAuthenticated;
        state.user = current.user;
        state.userRole = current.userRole;
        state.isBootstrapping = false;
        state.isLoading = false;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload?.user || null;
        state.userRole = action.payload?.userRole || 'USER';
        state.isLoading = false;
        state.error = null;
        startAutoTokenRefresh();
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = typeof action.payload === 'string' ? action.payload : (action.payload?.message || 'Login failed');
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload?.user || state.user;
        state.userRole = action.payload?.userRole || state.userRole;
      });
  }
});

export const { syncAuth, setSession, logout, setSochiotAccessToken } = slice.actions;
export const selectSochiotAccessToken = (state) => state.auth?.['Sochiot-accesstoken'] || (typeof localStorage !== 'undefined' ? localStorage.getItem('Sochiot-accesstoken') : null);
export const selectCurrentUser = (state) => state.auth?.user;
export const selectUserPermissions = (state) => state.auth?.user?.permissions || state.auth?.user?.resolvedPermissions || state.auth?.user?.authorities || [];
export const selectUserFeatures = (state) => state.auth?.user?.features || {};
export const selectAccessibleSites = (state) => state.auth?.user?.accessibleSites || [];
export const selectUserScope = (state) => state.auth?.user?.scope || null;
export default slice.reducer;
