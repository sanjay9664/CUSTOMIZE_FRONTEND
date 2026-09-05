import { configureStore } from '@reduxjs/toolkit';
import auth from './authSlice.js';
import theme from './themeSlice.js';
import deviceStatus from './deviceStatusSlice.js';

// Redact sensitive credentials from Redux DevTools inspection in development
const actionSanitizer = (action) => {
  if (!action) return action;

  // Mask plain-text passwords in action.meta.arg (e.g. auth/login/pending)
  if (action.meta?.arg && typeof action.meta.arg === 'object') {
    if ('password' in action.meta.arg) {
      return {
        ...action,
        meta: {
          ...action.meta,
          arg: {
            ...action.meta.arg,
            password: '***REDACTED***'
          }
        }
      };
    }
  }

  // Mask tokens or sensitive fields in payloads
  if (action.payload && typeof action.payload === 'object') {
    if ('password' in action.payload || 'token' in action.payload || 'accessToken' in action.payload) {
      return {
        ...action,
        payload: {
          ...action.payload,
          ...(action.payload.password ? { password: '***REDACTED***' } : {}),
          ...(action.payload.token ? { token: '***REDACTED***' } : {}),
          ...(action.payload.accessToken ? { accessToken: '***REDACTED***' } : {})
        }
      };
    }
  }

  return action;
};

const stateSanitizer = (state) => {
  if (!state) return state;
  if (state.auth?.user && typeof state.auth.user === 'object') {
    const { password, token, ...safeUser } = state.auth.user;
    return {
      ...state,
      auth: {
        ...state.auth,
        user: safeUser
      }
    };
  }
  return state;
};

const isDev = Boolean(import.meta.env.DEV);

export const store = configureStore({
  reducer: {
    auth,
    theme,
    deviceStatus
  },
  // Strictly disable DevTools in production builds; sanitize trace & actions in dev
  devTools: isDev
    ? {
        name: 'SCADA BMS Store',
        trace: false,
        actionSanitizer,
        stateSanitizer
      }
    : false,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        warnAfter: 64
      },
      immutableCheck: {
        warnAfter: 64
      }
    })
});

export default store;
