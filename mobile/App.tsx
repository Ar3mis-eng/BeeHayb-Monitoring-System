import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    return <SafeAreaView style={styles.loadingContainer} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppNavigator setIsLoggedIn={handleLoginSuccess} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8F5F0',
  },
});

export default App;
