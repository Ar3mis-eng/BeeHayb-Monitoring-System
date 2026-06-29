import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore, useHiveStore } from './src/utils/store';
import { authService, hiveService } from './src/services/api';
import { initializeWebSocket } from './src/services/websocket';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);
  const setHives = useHiveStore((state) => state.setHives);
  const setSelectedHiveId = useHiveStore((state) => state.setSelectedHiveId);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        // Check if user is already authenticated
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          setToken(token);
          try {
            const user = await authService.getCurrentUser();
            setUser(user);
            setIsLoggedIn(true);

            // Fetch hives
            const hives = await hiveService.getAllHives();
            setHives(hives);
            if (hives.length > 0) {
              setSelectedHiveId(hives[0].id);
            }

            // Initialize WebSocket
            initializeWebSocket();
          } catch (error) {
            console.log('Failed to restore session:', error);
            await AsyncStorage.removeItem('authToken');
          }
        } else {
          try {
            await authService.register('admin', 'admin@beehayb.local', 'Admin123');
          } catch (error) {
            console.log('Admin account already exists or could not be created:', error);
          }

          const response = await authService.login('admin', 'Admin123');
          setUser(response.user);
          setToken(response.token);
          setIsLoggedIn(true);

          // Fetch hives if the backend is available.
          try {
            const hives = await hiveService.getAllHives();
            setHives(hives);
            if (hives.length > 0) {
              setSelectedHiveId(hives[0].id);
            }
          } catch (error) {
            console.log('Admin session created locally; backend hive fetch skipped:', error);
          }

          initializeWebSocket();
        }
      } catch (error) {
        console.log('Error during app startup:', error);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const handleLoginSuccess = async () => {
    setIsLoggedIn(true);
    try {
      const hives = await hiveService.getAllHives();
      setHives(hives);
      if (hives.length > 0) {
        setSelectedHiveId(hives[0].id);
      }
      initializeWebSocket();
    } catch (error) {
      console.log('Error fetching hives:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar translucent={false} backgroundColor="#F8F5F0" barStyle="dark-content" />
        <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar translucent={false} backgroundColor="#F8F5F0" barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <AppNavigator setIsLoggedIn={handleLoginSuccess} />
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F0',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8F5F0',
  },
});

export default App;
