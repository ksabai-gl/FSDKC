import axios from "axios";

const client = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  withCredentials: true, // required for Sanctum SPA cookie-based auth
});

// Attach token (or rely on cookie session) to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear stale token/session and force re-login instead of silently failing
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("auth_token");
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

export default client;
