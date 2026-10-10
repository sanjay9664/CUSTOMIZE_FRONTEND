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

export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  const token = getAuthToken();
  const refreshToken = getRefreshToken();
  if (token || refreshToken) {
    if (!token || isTokenExpiringSoon(token, 180)) {
      await performTokenRefresh();
    }
  }
  const session = getSafeSession();
  if (session.isAuthenticated) {
    startAutoTokenRefresh();
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
    const user = sanitizeUserData(data?.user) || {};
    const userRole = user.role || 'ADMIN';

    // Persist securely to cookie, localStorage, & memory token session
    setAuthSession({
      token: data?.accessToken || data?.token || '',
      refreshToken: data?.refreshToken || '',
      userRole,
      userData: user
    });

    return { user, userRole, data };
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
      });
  }
});

export const { syncAuth, setSession, logout, setSochiotAccessToken } = slice.actions;
export const selectSochiotAccessToken = (state) => state.auth?.['Sochiot-accesstoken'] || (typeof localStorage !== 'undefined' ? localStorage.getItem('Sochiot-accesstoken') : null);
export default slice.reducer;
