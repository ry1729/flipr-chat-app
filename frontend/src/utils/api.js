// src/utils/api.js - Debug version
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
        console.log('✅ Token added to request:', user.token.substring(0, 30) + '...');
        console.log('📍 Request URL:', config.baseURL + config.url);
        console.log('🔗 Full headers:', config.headers);
      } else {
        console.log('❌ No token found in user object:', user);
      }
    } else {
      console.log('❌ No userInfo in localStorage');
    }
    return config;
  },
  (error) => {
    console.log('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response success:', response.status);
    return response;
  },
  (error) => {
    console.log('❌ API Response error:', error.response?.status, error.response?.data);
    if (error.response && error.response.status === 401) {
      console.error("🚨 401 Unauthorized - clearing token and redirecting");
      localStorage.removeItem('userInfo');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;