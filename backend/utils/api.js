import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_API_BASE_URL,
  withCredentials: true, // optional: if you're using cookies/session
});

export default api;
