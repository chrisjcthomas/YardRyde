import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROUTES, ROUTE_COLORS } from '../constants';
import { setupNotificationChannel } from '../services/notifications';

export default function SettingsScreen({ navigation }: any) {
  const isDark = useColorScheme() === 'dark';
  const [watchedRoutes, setWatchedRoutes] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem('watchedRoutes').then((val) => {
      if (val) setWatchedRoutes(new Set(JSON.parse(val)));
    });
  }, []);

  const toggleRoute = async (routeNumber: string) => {
    await setupNotificationChannel();
    setWatchedRoutes((prev) => {
      const next = new Set(prev);
      if (next.has(routeNumber)) next.delete(routeNumber);
      else next.add(routeNumber);
      AsyncStorage.setItem('watchedRoutes', JSON.stringify([...next]));
      return next;
    });
  };

  const bg = isDark ? '#1e1e1e' : 'white';
  const text = isDark ? '#f3f4f6' : '#111827';
  const subtext = isDark ? '#9ca3af' : '#6b7280';
  const cardBg = isDark ? '#2a2a2a' : '#f9fafb';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.title, { color: text }]}>Settings</Text>

      <Text style={[styles.section, { color: subtext }]}>NOTIFICATION PREFERENCES</Text>
      <Text style={[styles.description, { color: subtext }]}>
        Get notified when a bus on these routes is nearby.
      </Text>

      {ROUTES.map((route) => (
        <View key={route.id} style={[styles.row, { backgroundColor: cardBg }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.routeLabel, { color: ROUTE_COLORS[route.number] }]}>
              Route {route.number}
            </Text>
            <Text style={{ color: subtext, fontSize: 13 }}>{route.name}</Text>
          </View>
          <Switch
            value={watchedRoutes.has(route.number)}
            onValueChange={() => toggleRoute(route.number)}
            trackColor={{ false: '#e5e7eb', true: '#17a14e' }}
            thumbColor="white"
          />
        </View>
      ))}

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back to Map</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  section: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },
  description: { fontSize: 14, marginBottom: 16, marginTop: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 12, marginBottom: 8,
  },
  routeLabel: { fontWeight: 'bold', fontSize: 16 },
  backButton: {
    marginTop: 32, backgroundColor: '#17a14e', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  backButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
