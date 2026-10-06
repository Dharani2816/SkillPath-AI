import axios from 'axios';

const TOKEN_KEY = 'skillpath.token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable: session-only login */
  }
};

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401 && getToken()) {
      setToken(null);
      window.dispatchEvent(new Event('skillpath:logout'));
    }
    return Promise.reject(err);
  },
);

export const errorMessage = (err) =>
  (err && err.response && err.response.data && err.response.data.error) ||
  (err && err.code === 'ERR_NETWORK' ? 'Cannot reach the SkillPath server. Is the backend running?' : null) ||
  (err && err.message) ||
  'Something went wrong';

export default api;
