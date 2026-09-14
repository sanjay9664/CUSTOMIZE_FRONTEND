/**
 * Standardized API Error & Notification Handler
 * Inspired by ismartaccess-frontend-v2 (src/utilities/configureAxios.js)
 * 
 * Provides centralized error parsing, user-friendly messages,
 * 401 session expiration handling, and toast event dispatching.
 */

/**
 * Parses any error (Axios, Fetch, ApiError, or generic Error) into a structured object.
 * @param {Error|Object|string} err 
 * @param {string} fallbackMessage 
 * @returns {{ message: string, status: number, code: string, isNetworkError: boolean, isAuthError: boolean }}
 */
export const parseApiError = (err, fallbackMessage = 'An unexpected error occurred. Please try again.') => {
  if (!err) {
    return {
      message: fallbackMessage,
      status: 0,
      code: 'UNKNOWN_ERROR',
      isNetworkError: false,
      isAuthError: false
    };
  }

  // If already string
  if (typeof err === 'string') {
    return {
      message: err,
      status: 0,
      code: 'CUSTOM_ERROR',
      isNetworkError: false,
      isAuthError: false
    };
  }

  const status = err.status || err.response?.status || err.statusCode || 0;
  const isNetworkError = status === 0 || err.code === 'NETWORK_ERROR' || err.message?.includes('Failed to fetch') || err.message?.includes('Network Error');
  const isAuthError = status === 401;

  let message = fallbackMessage;

  if (isNetworkError) {
    message = 'Unable to connect to server. Please check your network or try again later.';
  } else if (status === 401) {
    message = 'Session expired or invalid credentials. Please log in again.';
  } else if (status === 403) {
    message = 'Access denied. You do not have permission for this resource.';
  } else if (status === 404) {
    message = 'Requested resource was not found.';
  } else if (err.response?.data?.message) {
    message = err.response.data.message;
  } else if (err.response?.data?.error?.message) {
    message = err.response.data.error.message;
  } else if (typeof err.response?.data?.error === 'string') {
    message = err.response.data.error;
  } else if (err.data?.message) {
    message = err.data.message;
  } else if (err.message && !err.message.includes('object Object')) {
    message = err.message;
  }

  const code = err.code || err.response?.data?.code || (status ? `HTTP_${status}` : 'INTERNAL_ERROR');

  return {
    message,
    status,
    code,
    isNetworkError,
    isAuthError
  };
};

/**
 * Global notification dispatcher for errors.
 * Emits a custom window event 'bms_toast_notification' so UI components can display it.
 * Also invokes callback if provided.
 */
export const notifyApiError = (err, fallbackMessage = 'Operation failed', showToastCallback = null) => {
  const parsed = parseApiError(err, fallbackMessage);

  if (typeof showToastCallback === 'function') {
    showToastCallback('danger', parsed.message);
  }

  // Dispatch custom event for global toast listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('bms_toast_notification', {
        detail: {
          type: 'danger',
          title: parsed.status ? `Error (${parsed.status})` : 'Error',
          message: parsed.message,
          error: parsed
        }
      })
    );

    // If 401 Unauthorized, dispatch auth expired event
    if (parsed.isAuthError) {
      window.dispatchEvent(new CustomEvent('bms_auth_unauthorized', { detail: parsed }));
    }
  }

  return parsed;
};

export default {
  parseApiError,
  notifyApiError
};
