import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { authService } from '../services/api';
import { useAuthStore } from '../utils/store';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('beekeeper');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.login(username, password);
      setUser(response.user);
      setToken(response.token);
      onLoginSuccess();
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    try {
      setLoading(true);
      const user = await authService.register(username, `${username}@beehayb.local`, password);
      Alert.alert('Success', 'Account created. Please login.');
      // Auto-login after registration
      const response = await authService.login(username, password);
      setUser(response.user);
      setToken(response.token);
      onLoginSuccess();
    } catch (error) {
      Alert.alert('Registration Failed', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.appName}>Bee-Hayb</Text>
        <Text style={styles.subtitle}>Smart Beehive Monitoring</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter username"
            value={username}
            onChangeText={setUsername}
            editable={!loading}
            placeholderTextColor="#CCC"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
            placeholderTextColor="#CCC"
          />

          <TouchableOpacity
            style={[styles.button, styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.registerButton, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#D9A25F" />
            ) : (
              <Text style={[styles.buttonText, styles.registerButtonText]}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.demoText}>Demo: username: beekeeper</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 48,
    fontWeight: '700',
    color: '#D9A25F',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  form: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E2E2E',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    color: '#2E2E2E',
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  loginButton: {
    backgroundColor: '#D9A25F',
  },
  registerButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D9A25F',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  registerButtonText: {
    color: '#D9A25F',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  demoText: {
    marginTop: 20,
    fontSize: 12,
    color: '#999',
  },
});

export default LoginScreen;
