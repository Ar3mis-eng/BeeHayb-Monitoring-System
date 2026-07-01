import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import LoginScreen from '../screens/LoginScreen';
import LiveMonitorScreen from '../screens/LiveMonitorScreen';
import TrendsScreen from '../screens/TrendsScreen';
import FleetViewScreen from '../screens/FleetViewScreen';
import AnalyticsHistoryScreen from '../screens/AnalyticsHistoryScreen';
import AmbientBackground from '../components/AmbientBackground';
import { useAuthStore } from '../utils/store';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DashboardTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBarShell}>
      <View style={styles.tabBarRow}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : typeof options.title === 'string'
                ? options.title
                : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={[styles.tabButton, isFocused && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, isFocused && styles.tabButtonTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

interface NavigationProps {
  setIsLoggedIn: (isLoggedIn: boolean) => void;
}

const DashboardTabs: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <DashboardTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarPosition: 'top',
      }}
    >
      <Tab.Screen
        name="LiveMonitor"
        component={LiveMonitorScreen}
        options={{
          title: 'Live Monitor',
          tabBarLabel: 'Live Monitor',
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
          tabBarLabel: 'Fleet View',
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC<NavigationProps> = ({ setIsLoggedIn }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  return (
    <NavigationContainer>
      <View style={styles.shell}>
        <AmbientBackground />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: 'transparent',
            },
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
            <>
              <Stack.Screen
                name="Dashboard"
                component={DashboardTabs}
                options={{ animationTypeForReplace: 'pop' }}
              />
              <Stack.Screen
                name="AnalyticsHistory"
                component={AnalyticsHistoryScreen}
                options={{ animation: 'slide_from_right' }}
              />
            </>
          )}
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#F8F5F0',
  },
  tabBarShell: {
    backgroundColor: 'rgba(248, 245, 240, 0.72)',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E3DB',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
  },
  tabBarRow: {
    flexDirection: 'row',
    columnGap: 12,
  },
  tabButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D9D1C2',
    backgroundColor: '#FCFAF6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  tabButtonActive: {
    backgroundColor: '#D29A52',
    borderColor: '#D29A52',
  },
  tabButtonText: {
    color: '#3E352A',
    fontSize: 14,
    fontWeight: '700',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
});
