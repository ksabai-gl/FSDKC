import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true, // Sanctum SPA auth relies exclusively on the session cookie
});

// Ensure CSRF cookie is set before state-changing requests (Sanctum requirement)
export const ensureCsrfCookie = () =>
  axios.get(`${process.env.REACT_APP_API_URL}/sanctum/csrf-cookie`, {
    withCredentials: true,
  });

// No Authorization header / localStorage token logic — the cookie session is
// the single source of truth for authentication, avoiding the dual-credential
// inconsistency flagged in code review (mixing withCredentials + Bearer token).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Session expired/invalid — surface to caller for redirect to login.
      return Promise.reject({ ...error, sessionExpired: true });
    }
    return Promise.reject(error);
  }
);

export default api;
