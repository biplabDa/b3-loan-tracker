import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import FormInput from '../components/FormInput';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { setApiBaseUrl } from '../api/client';

export default function LoginScreen() {
  const { login } = useAuth();
  const [apiUrl, setApiUrl] = useState('http://localhost:5000/api');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    try {
      setSubmitting(true);
      setApiBaseUrl(apiUrl.trim());
      await login(username.trim(), password);
    } catch (error) {
      Alert.alert('Login failed', error?.response?.data?.message || 'Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>B3 Enterprise</Text>
        <Text style={styles.subtitle}>Loan Tracking Login</Text>

        <FormInput value={apiUrl} onChangeText={setApiUrl} label="API Base URL" autoCapitalize="none" />
        <FormInput value={username} onChangeText={setUsername} label="Username" autoCapitalize="none" />
        <FormInput
          value={password}
          onChangeText={setPassword}
          label="Password"
          secureTextEntry
          autoCapitalize="none"
        />

        <Pressable style={styles.button} onPress={handleLogin} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Signing in...' : 'Login'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 16
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: 18
  },
  button: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  }
});
