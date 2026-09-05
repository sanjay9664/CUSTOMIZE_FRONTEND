import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getAuthToken, getUserData, getUserRole, clearAuthSession, setAuthSession, getCookie, isTokenExpiringSoon } from '../utils/cookieUtils.js';
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
  if (!token || isTokenExpiringSoon(token, 180)) {
    await performTokenRefresh();
  }
  const session = getSafeSession();
  if (session.isAuthenticated) {
    startAutoTokenRefresh();
  }
  return session;
});

export const login = createAsyncThunk('auth/login', async ({ identifier, password }, { rejectWithValue }) => {
  const cleanId = typeof identifier === 'string' ? identifier.trim() : '';
  if (!cleanId || !password) {
    return rejectWithValue('Please enter both username/email and password.');
  }

  try {
    const response = await fetch(AUTH_ENDPOINTS.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ identifier: cleanId, email: cleanId, password })
    });
    const result = await response.json();
    if (!response.ok) {
      return rejectWithValue(result?.error?.message || result?.message || 'Invalid username/email or password');
    }

    const data = result?.data || result;
    const user = sanitizeUserData(data?.user) || {};
    const userRole = user.role || 'ADMIN';

    // Persist securely to cookie / memory token session (not in global Redux state tree)
    setAuthSession({
      token: data?.accessToken || data?.token || '',
      refreshToken: data?.refreshToken || '',
      userRole,
      userData: user
    });

    return { user, userRole, data };
  } catch (err) {
    return rejectWithValue(`Unable to connect to authentication server at ${AUTH_ENDPOINTS.login}.`);
  }
});

const initialState = {
  ...getSafeSession(),
  isLoading: true,
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
    logout: (state) => {
      stopAutoTokenRefresh();
      clearAuthSession();
      state.isAuthenticated = false;
      state.user = null;
      state.userRole = 'USER';
      state.error = null;
      state.isLoading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.isAuthenticated = Boolean(action.payload?.isAuthenticated);
        state.user = action.payload?.user || null;
        state.userRole = action.payload?.userRole || 'USER';
        state.isLoading = false;
        state.error = null;
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        const current = getSafeSession();
        state.isAuthenticated = current.isAuthenticated;
        state.user = current.user;
        state.userRole = current.userRole;
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
        // NOTE: action.payload.data (containing raw JWT tokens) is intentionally NOT stored on state to prevent XSS exposure
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Login failed';
      });
  }
});

export const { syncAuth, setSession, logout } = slice.actions;
export default slice.reducer;
