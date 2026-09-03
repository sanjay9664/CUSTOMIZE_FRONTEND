import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getAuthToken, getUserData, getUserRole, clearAuthSession, setAuthSession, getCookie } from '../utils/cookieUtils';
import { performTokenRefresh } from '../services/authRefreshService';
import { AUTH_ENDPOINTS } from '../utils/apiConfig';
const session = () => { const isAuthenticated = Boolean(getAuthToken() || localStorage.getItem('isAuthenticated') === 'true'); return { isAuthenticated, user: isAuthenticated ? getUserData() : null, userRole: isAuthenticated ? (getUserRole() || 'USER') : 'USER' }; };
export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  if (!getAuthToken() && (getCookie('refresh_token') || localStorage.getItem('refresh_token'))) await performTokenRefresh();
  return session();
});
export const login = createAsyncThunk('auth/login', async ({ identifier, password }, { rejectWithValue }) => {
  try {
    const response = await fetch(AUTH_ENDPOINTS.login, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ identifier, email: identifier, password }) });
    const result = await response.json();
    if (!response.ok) return rejectWithValue(result?.error?.message || result?.message || 'Invalid username/email or password');
    const data = result?.data || result;
    const user = data?.user || {};
    const userRole = user.role || 'ADMIN';
    setAuthSession({ token: data?.accessToken || data?.token || '', refreshToken: data?.refreshToken || '', userRole, userData: user });
    return { user, userRole, data };
  } catch {
    return rejectWithValue(`Unable to connect to authentication server at ${AUTH_ENDPOINTS.login}.`);
  }
});
const slice = createSlice({ name: 'auth', initialState: { ...session(), isLoading: true, error: null }, reducers: { syncAuth: (s) => Object.assign(s, session()), setSession: (s, a) => Object.assign(s, a.payload, { isAuthenticated: true }), logout: (s) => { clearAuthSession(); Object.assign(s, { isAuthenticated: false, user: null, userRole: 'USER' }); } }, extraReducers: (builder) => builder.addCase(bootstrapAuth.fulfilled, (s, a) => Object.assign(s, a.payload, { isLoading: false })).addCase(bootstrapAuth.rejected, (s) => { Object.assign(s, session(), { isLoading: false }); }).addCase(login.fulfilled, (s, a) => Object.assign(s, a.payload, { isAuthenticated: true, error: null })).addCase(login.rejected, (s, a) => { s.error = a.payload || 'Login failed'; }) });
export const { syncAuth, setSession, logout } = slice.actions;
export default slice.reducer;
