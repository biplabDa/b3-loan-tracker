import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
      }
      setLoading(false);
    };

    bootstrap();
  }, []);

  const login = async (username, password) => {
    const response = await client.post('/auth/login', { username, password });
    const value = response.data.token;
    await AsyncStorage.setItem('token', value);
    setToken(value);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
  };

  const contextValue = useMemo(
    () => ({ token, loading, isAuthenticated: Boolean(token), login, logout }),
    [token, loading]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
