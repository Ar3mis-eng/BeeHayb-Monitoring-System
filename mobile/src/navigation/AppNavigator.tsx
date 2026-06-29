import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import LoginScreen from '../screens/LoginScreen';
import LiveMonitorScreen from '../screens/LiveMonitorScreen';
import TrendsScreen from '../screens/TrendsScreen';
import FleetViewScreen from '../screens/FleetViewScreen';
import { useAuthStore } from '../utils/store';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

interface NavigationProps {
  setIsLoggedIn: (isLoggedIn: boolean) => void;
}

const DashboardTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#D9A25F',
        tabBarInactiveTintColor: '#CCC',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E8E3DB',
          height: 60,
          paddingBottom: 8,
        },
      }}
    >
      <Tab.Screen
        name="LiveMonitor"
        component={LiveMonitorScreen}
        options={{
          title: 'Live Monitor',
          tabBarLabel: 'Live',
        }}
      />
      <Tab.Screen
        name="Trends"
        component={TrendsScreen}
        options={{
          title: 'Trends',
          tabBarLabel: 'Trends',
        }}
      />
      <Tab.Screen
        name="FleetView"
        component={FleetViewScreen}
        options={{
          title: 'Fleet View',
          tabBarLabel: 'Fleet',
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC<NavigationProps> = ({ setIsLoggedIn }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            options={{ animationTypeForReplace: 'pop' }}
          >
            {(props) => <LoginScreen {...props} onLoginSuccess={() => setIsLoggedIn(true)} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen
            name="Dashboard"
            component={DashboardTabs}
            options={{ animationTypeForReplace: 'pop' }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
