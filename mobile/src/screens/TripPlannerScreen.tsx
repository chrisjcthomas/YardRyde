import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ROUTES, ROUTE_COLORS } from '../constants';
import { calculateDistance } from '../services/eta';

interface Vehicle {
  id: string;
  route: string;
  lat: number;
  lng: number;
}

function getAllStops() {
  const stopMap = new Map<string, { name: string; latitude: number; longitude: number; routes: string[] }>();
  ROUTES.forEach((route) => {
    route.stops.forEach((stop) => {
      if (!stopMap.has(stop.name)) {
        stopMap.set(stop.name, { ...stop, routes: [route.number] });
      } else {
        stopMap.get(stop.name)!.routes.push(route.number);
      }
    });
  });
  return Array.from(stopMap.values());
}

export default function TripPlannerScreen({ route, navigation }: any) {
  const vehicles: Vehicle[] = route.params?.vehicles || [];
  const [fromStop, setFromStop] = useState('');
  const [toStop, setToStop] = useState('');
  const isDark = useColorScheme() === 'dark';

  const allStops = useMemo(() => getAllStops(), []);

  const results = useMemo(() => {
    if (!fromStop || !toStop || fromStop === toStop) return null;
    return ROUTES.filter((r) => {
      const names = r.stops.map((s) => s.name);
      return names.includes(fromStop) && names.includes(toStop);
    }).map((r) => {
      const fromData = r.stops.find((s) => s.name === fromStop)!;
      const nearestBus = vehicles
        .filter((v) => v.route === r.number)
        .map((v) => ({
          ...v,
          dist: calculateDistance(v.lat, v.lng, fromData.latitude, fromData.longitude),
        }))
        .sort((a, b) => a.dist - b.dist)[0];
      const eta = nearestBus ? Math.max(1, Math.round((nearestBus.dist / 20) * 60)) : null;
      return { route: r, eta, hasBus: !!nearestBus };
    });
  }, [fromStop, toStop, vehicles]);

  const bg = isDark ? '#1e1e1e' : 'white';
  const text = isDark ? '#f3f4f6' : '#111827';
  const subtext = isDark ? '#9ca3af' : '#6b7280';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.title, { color: text }]}>Trip Planner</Text>
      <Text style={[styles.subtitle, { color: subtext }]}>Find your route</Text>

      <Text style={[styles.label, { color: subtext }]}>FROM</Text>
      <View style={[styles.pickerContainer, isDark && styles.pickerDark]}>
        <Picker selectedValue={fromStop} onValueChange={setFromStop} style={{ color: text }}>
          <Picker.Item label="Select stop..." value="" />
          {allStops.map((s) => (
            <Picker.Item key={`from-${s.name}`} label={s.name} value={s.name} />
          ))}
        </Picker>
      </View>

      <Text style={[styles.label, { color: subtext }]}>TO</Text>
      <View style={[styles.pickerContainer, isDark && styles.pickerDark]}>
        <Picker selectedValue={toStop} onValueChange={setToStop} style={{ color: text }}>
          <Picker.Item label="Select stop..." value="" />
          {allStops
            .filter((s) => s.name !== fromStop)
            .map((s) => (
              <Picker.Item key={`to-${s.name}`} label={s.name} value={s.name} />
            ))}
        </Picker>
      </View>

      {results && results.length === 0 && (
        <Text style={[styles.noResults, { color: subtext }]}>
          No direct routes found between these stops.
        </Text>
      )}

      {results &&
        results.map(({ route: r, eta, hasBus }) => (
          <View key={r.id} style={[styles.resultCard, isDark && styles.resultCardDark]}>
            <View>
              <Text style={[styles.routeNumber, { color: ROUTE_COLORS[r.number] }]}>
                Route {r.number}
              </Text>
              <Text style={{ color: subtext, fontSize: 13 }}>{r.name}</Text>
            </View>
            {hasBus ? (
              <Text style={styles.eta}>~{eta} min</Text>
            ) : (
              <Text style={{ color: subtext, fontSize: 13 }}>No bus active</Text>
            )}
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
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginBottom: 24 },
  label: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 4 },
  pickerContainer: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, backgroundColor: '#f9fafb' },
  pickerDark: { borderColor: '#374151', backgroundColor: '#2a2a2a' },
  noResults: { textAlign: 'center', marginTop: 24 },
  resultCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6',
    backgroundColor: '#f9fafb', marginTop: 12,
  },
  resultCardDark: { borderColor: '#374151', backgroundColor: '#2a2a2a' },
  routeNumber: { fontWeight: 'bold', fontSize: 16 },
  eta: { fontWeight: 'bold', fontSize: 18, color: '#17a14e' },
  backButton: {
    marginTop: 32, backgroundColor: '#17a14e', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  backButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
