import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

const TabIcon = ({
  glyph,
  color,
  size,
}: {
  glyph: string;
  color: string;
  size?: number;
}) => (
  <View style={styles.tabIconWrap}>
    <Text style={[styles.tabGlyph, { color, fontSize: size ?? 18 }]}>{glyph}</Text>
  </View>
);

const DashboardTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowIcon: true,
        tabBarLabelPosition: 'below-icon',
        tabBarActiveTintColor: '#D9A25F',
        tabBarInactiveTintColor: '#8D948F',
        tabBarStyle: {
          backgroundColor: '#FCFAF6',
          borderTopColor: '#E8E3DB',
          borderTopWidth: 1,
          height: 76,
          paddingBottom: 12,
          paddingTop: 10,
          marginHorizontal: 14,
          marginBottom: 10,
          borderRadius: 22,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 16,
          shadowColor: '#10231F',
          shadowOpacity: 0.12,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.4,
        },
      }}
    >
      <Tab.Screen
        name="LiveMonitor"
        component={LiveMonitorScreen}
        options={{
          title: 'Live Monitor',
          tabBarLabel: 'Live',
          tabBarIcon: ({ color, size }) => (
            <TabIcon glyph="◉" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Trends"
        component={TrendsScreen}
        options={{
          title: 'Trends',
          tabBarLabel: 'Trends',
          tabBarIcon: ({ color, size }) => (
            <TabIcon glyph="↗" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="FleetView"
        component={FleetViewScreen}
        options={{
          title: 'Fleet View',
          tabBarLabel: 'Fleet',
          tabBarIcon: ({ color, size }) => (
            <TabIcon glyph="▦" color={color} size={size} />
          ),
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
        {isAuthenticated ? (
          <View style={styles.ribbon}>
            <View>
              <Text style={styles.ribbonLabel}>BeeHayb Monitoring</Text>
              <Text style={styles.ribbonTitle}>Live Hive Telemetry</Text>
            </View>
            <View style={styles.ribbonBadge}>
              <Text style={styles.ribbonBadgeText}>Admin</Text>
            </View>
          </View>
        ) : null}
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animationEnabled: true,
            contentStyle: {
              backgroundColor: '#F8F5F0',
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
            <Stack.Screen
              name="Dashboard"
              component={DashboardTabs}
              options={{ animationTypeForReplace: 'pop' }}
            />
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
  ribbon: {
    backgroundColor: '#10231F',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(141, 195, 167, 0.18)',
  },
  ribbonLabel: {
    color: '#8DC3A7',
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  ribbonTitle: {
    color: '#FFF8EF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  ribbonBadge: {
    backgroundColor: 'rgba(217, 162, 95, 0.16)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(217, 162, 95, 0.28)',
  },
  ribbonBadgeText: {
    color: '#F2D2A8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tabIconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabGlyph: {
    includeFontPadding: false,
    textAlign: 'center',
    lineHeight: 24,
  },
});
