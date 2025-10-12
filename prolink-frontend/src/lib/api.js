// src/lib/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// This interceptor adds the token to every outgoing request
api.interceptors.request.use(
  (config) => {
    let token = null;
    try {
      token = localStorage.getItem('token');
    } catch (err) {
      console.warn('[api] localStorage not available', err);
    }
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log('[api] request ->', { method: config.method, url: config.url, headers: config.headers });
    return config;
  },
  (error) => Promise.reject(error)
);

// ==> THIS IS THE DEFINITIVE FIX FOR THE BLANK SCREEN <==
// This interceptor checks every response from the server for security errors.
api.interceptors.response.use(
  (response) => response, // If the response is good, just pass it along.
  (error) => {
    // Provide richer debug information about the failure in a serializable form
    const safeError = {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      config: error?.config ? { method: error.config.method, url: error.config.url } : undefined,
      response: error?.response ? { status: error.response.status, data: error.response.data } : undefined,
      request: error?.request ? true : undefined,
    };
    // Log a clear string plus the safe object so console viewers and remote loggers see useful info
    console.error('[api] response error', JSON.stringify(safeError, null, 2));
    // If the server responds with a 401 Unauthorized error...
    if (error.response && error.response.status === 401) {
      // 1. Remove the invalid token from storage.
      localStorage.removeItem('token');
      
      // 2. Redirect the user to the login page to get a new token.
      // This check prevents an infinite loop if the login page itself has an error.
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        // Use a clear alert so the user knows what's happening.
        alert("Your session has expired. Please log in again.");
        window.location.href = '/login';
      }
    }
    // For all other errors, just pass them along for the component to handle.
    return Promise.reject(error);
  }
);

export default api;

