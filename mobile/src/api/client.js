import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:5001/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});
// console.log('API client initialized with base URL:', API_BASE_URL); 

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const setApiBaseUrl = (url) => {
  client.defaults.baseURL = url;
};

export default client;
