import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getHost = () => {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  }
  
  // Dynamically resolve the LAN IP of the Expo development machine
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }
  return '172.20.10.8'; // Fallback
};

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${getHost()}:8001/api`;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`[API] Sending request with token to: ${config.url}`);
  } else {
    // Whitelist auth endpoints to avoid confusing "No token" warnings during login/register
    const isAuthRoute = config.url?.includes('/auth/firebase-login/') || 
                        config.url?.includes('/auth/login/') || 
                        config.url?.includes('/auth/register/');
    if (!isAuthRoute) {
      console.warn(`[API] No token found in store for request to: ${config.url}`);
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Auto-logout on 401 Unauthorized (expired / invalid token)
    if (error.response?.status === 401) {
      console.warn('[API] 401 Unauthorized — clearing auth state and redirecting to login.');
      useAuthStore.getState().logout();
    }

    let errMessage = `API error: ${error.response?.status || 'Unknown'}`;
    if (error.response?.data) {
      errMessage = error.response.data.error || JSON.stringify(error.response.data);
    }
    return Promise.reject(new Error(errMessage));
  }
);
