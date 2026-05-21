// Configuração do Axios (exemplo)
import axios from 'axios';

export const api = axios.create({
  // baseURL: 'https://quintal-backend-224.onrender.com',      
  baseURL: 'http://localhost:3001',
  withCredentials: true
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let redirecting = false;

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && !redirecting) {
      redirecting = true;
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);