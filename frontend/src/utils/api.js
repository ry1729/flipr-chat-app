// src/utils/api.js
import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_API_BASE_URL || '/api', // Use your backend base URL or a relative path
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the authorization token
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors (e.g., token expiry)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Example: If 401 Unauthorized, maybe log out the user
    if (error.response && error.response.status === 401) {
      // You would dispatch a logout action from your AuthContext here
      // For now, let's just log it.
      console.error("API Error 401: Unauthorized. User might be logged out.");
      // window.location.href = '/login'; // Or dispatch a logout action from context
    }
    return Promise.reject(error);
  }
);

export default api;