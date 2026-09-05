/**
 * Global Fetch Interceptor for BMS Application
 * 
 * Intercepts window.fetch for all backend API calls:
 * 1. Proactively checks if access token is expiring (< 30s) and refreshes it before sending.
 * 2. Attaches 'credentials: include' to transmit and store cookies.
 * 3. Reactively catches 401 Unauthorized responses, triggers performTokenRefresh(true),
 *    and retries the original request with the renewed token.
 */
import { getAuthToken, isTokenExpiringSoon, clearAuthSession } from '../utils/cookieUtils';
import { performTokenRefresh } from './authRefreshService';

const withUpdatedAuthHeader = (existingHeaders, token) => {
  if (typeof Headers !== 'undefined' && existingHeaders instanceof Headers) {
    const h = new Headers(existingHeaders);
    h.set('Authorization', `Bearer ${token}`);
    return h;
  }
  if (Array.isArray(existingHeaders)) {
    const filtered = existingHeaders.filter(([k]) => k.toLowerCase() !== 'authorization');
    filtered.push(['Authorization', `Bearer ${token}`]);
    return filtered;
  }
  const obj = typeof existingHeaders === 'object' && existingHeaders !== null ? { ...existingHeaders } : {};
  delete obj.authorization;
  obj['Authorization'] = `Bearer ${token}`;
  return obj;
};

export const installGlobalFetchInterceptor = () => {
  if (typeof window === 'undefined' || window._bmsFetchInterceptorInstalled) {
    return;
  }
  window._bmsFetchInterceptorInstalled = true;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');

    let currentInit = { ...init };

    const hasAuthHeader = Boolean(
      (currentInit.headers && (
        (typeof currentInit.headers.get === 'function' && currentInit.headers.get('Authorization')) ||
        currentInit.headers.Authorization ||
        currentInit.headers.authorization
      )) ||
      (input instanceof Request && input.headers && input.headers.get('Authorization'))
    );

    // Identify if this is an API or authenticated request
    const isApiRequest = url.includes('/api') || 
                         url.includes('/auth') || 
                         url.includes('/super-admin') || 
                         url.includes('/sochiot') ||
                         hasAuthHeader;

    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/forgot-password');

    // 1. Proactive Refresh Check before outgoing authenticated requests
    if (isApiRequest && !isAuthRoute) {
      const currentToken = getAuthToken();
      if (currentToken && isTokenExpiringSoon(currentToken, 30)) {
        try {
          const freshToken = await performTokenRefresh(true);
          if (freshToken) {
            currentInit.headers = withUpdatedAuthHeader(currentInit.headers, freshToken);
          }
        } catch (e) {
          // Fall through and let request proceed if refresh errors
        }
      }
    }

    // Ensure credentials: 'include' for all backend API requests so cookies flow
    if (isApiRequest && currentInit.credentials === undefined) {
      currentInit.credentials = 'include';
    }

    let response;
    try {
      response = await nativeFetch(input, currentInit);
    } catch (err) {
      throw err;
    }

    // 2. Reactive 401 Interceptor: If backend responds 401, perform token refresh and retry once
    if (response && response.status === 401 && isApiRequest && !isAuthRoute) {
      try {
        const renewedToken = await performTokenRefresh(true);
        if (renewedToken) {
          const retryInit = {
            ...currentInit,
            headers: withUpdatedAuthHeader(currentInit.headers, renewedToken),
            credentials: 'include'
          };

          return await nativeFetch(input, retryInit);
        } else {
          clearAuthSession();
          if (typeof window !== 'undefined' && window.location && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      } catch (refreshErr) {
        console.warn('[FetchInterceptor] 401 retry failed:', refreshErr);
      }
    }

    return response;
  };

  console.log('[FetchInterceptor] Global fetch interceptor installed.');
};
