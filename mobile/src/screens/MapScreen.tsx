import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import MapView, { Marker, Polyline, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import socket from '../services/socket';
import { calculateETA } from '../services/eta';
import {
  KINGSTON_CENTER,
  DEFAULT_ZOOM_DELTA,
  ROUTES,
  ROUTE_COLORS,
  REPORT_TYPES,
} from '../constants';

interface Vehicle {
  id: string;
  route: string;
  lat: number;
  lng: number;
  accessible?: boolean;
}

interface Report {
  id: string;
  type: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export default function MapScreen({ navigation }: any) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [connected, setConnected] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    socket.on('vehicles:state', setVehicles);
    socket.on('reports:state', setReports);
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('rider:subscribe');
    });
    socket.on('disconnect', () => setConnected(false));

    if (socket.connected) {
      setConnected(true);
      socket.emit('rider:subscribe');
    }

    return () => {
      socket.off('vehicles:state');
      socket.off('reports:state');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const filteredVehicles = selectedRoute
    ? vehicles.filter((v) => v.route === selectedRoute)
    : vehicles;

  const handleReport = useCallback(
    (type: string) => {
      socket.emit('report:create', {
        type,
        lat: KINGSTON_CENTER.latitude,
        lng: KINGSTON_CENTER.longitude,
      });
    },
    [],
  );

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{ ...KINGSTON_CENTER, ...DEFAULT_ZOOM_DELTA }}
      >
        {/* Route Polylines */}
        {ROUTES.map((route) => {
          const isActive = !selectedRoute || selectedRoute === route.number;
          return (
            <Polyline
              key={route.id}
              coordinates={route.coordinates}
              strokeColor={ROUTE_COLORS[route.number] || '#6b7280'}
              strokeWidth={isActive ? 4 : 2}
              lineDashPattern={isActive ? undefined : [5, 5]}
            />
          );
        })}

        {/* Stop Markers */}
        {ROUTES.filter((r) => !selectedRoute || selectedRoute === r.number)
          .flatMap((route) =>
            route.stops.map((stop) => (
              <Circle
                key={`${route.id}-${stop.name}`}
                center={stop}
                radius={80}
                fillColor="white"
                strokeColor={ROUTE_COLORS[route.number] || '#6b7280'}
                strokeWidth={3}
              />
            )),
          )}

        {/* Bus Markers */}
        {filteredVehicles.map((bus) => {
          const eta = calculateETA(
            bus.lat,
            bus.lng,
            KINGSTON_CENTER.latitude,
            KINGSTON_CENTER.longitude,
          );
          return (
            <Marker
              key={bus.id}
              coordinate={{ latitude: bus.lat, longitude: bus.lng }}
              title={`Route ${bus.route}${bus.accessible ? ' ♿' : ''}`}
              description={`ETA: ~${eta} min`}
              pinColor={ROUTE_COLORS[bus.route] || 'green'}
            />
          );
        })}

        {/* Report Markers */}
        {reports.map((report) => {
          const rt = Object.values(REPORT_TYPES).find((t) => t.id === report.type);
          return (
            <Circle
              key={report.id}
              center={{ latitude: report.lat, longitude: report.lng }}
              radius={120}
              fillColor={rt?.color || '#fbbf24'}
              strokeColor="white"
              strokeWidth={2}
            />
          );
        })}
      </MapView>

      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.title, isDark && styles.textLight]}>
          🚌 Kingston Transit
        </Text>
        <View
          style={[styles.statusDot, { backgroundColor: connected ? '#17a14e' : '#9ca3af' }]}
        />
        <Text style={{ color: connected ? '#17a14e' : '#9ca3af', fontSize: 13 }}>
          {connected ? 'Live' : 'Offline'}
        </Text>
      </View>

      {/* Route Filter */}
      <View style={[styles.filterPanel, isDark && styles.filterPanelDark]}>
        <TouchableOpacity
          style={[styles.filterPill, !selectedRoute && styles.filterPillActive]}
          onPress={() => setSelectedRoute(null)}
        >
          <Text style={[styles.filterText, !selectedRoute && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {ROUTES.map((route) => (
          <TouchableOpacity
            key={route.id}
            style={[
              styles.filterPill,
              selectedRoute === route.number && {
                backgroundColor: ROUTE_COLORS[route.number],
                borderColor: ROUTE_COLORS[route.number],
              },
            ]}
            onPress={() =>
              setSelectedRoute(selectedRoute === route.number ? null : route.number)
            }
          >
            <Text
              style={[
                styles.filterText,
                selectedRoute === route.number && styles.filterTextActive,
              ]}
            >
              {route.number}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={[styles.statusText, isDark && styles.textLight]}>
          Buses: {filteredVehicles.length} | Reports: {reports.length}
        </Text>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.tripButton}
          onPress={() => navigation.navigate('TripPlanner', { vehicles })}
        >
          <Text style={styles.tripButtonText}>🗺️ Trip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => handleReport('delay')}
        >
          <Text style={styles.reportButtonText}>😊 Report Vibe</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  header: {
    position: 'absolute', top: 50, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 30,
    paddingHorizontal: 20, paddingVertical: 12,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
  headerDark: { backgroundColor: 'rgba(30,30,30,0.95)' },
  title: { fontWeight: 'bold', fontSize: 16, color: '#111827' },
  textLight: { color: '#f3f4f6' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  filterPanel: {
    position: 'absolute', bottom: 120, left: 16,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12,
    padding: 12, maxWidth: 220,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
  },
  filterPanelDark: { backgroundColor: 'rgba(30,30,30,0.95)' },
  filterPill: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
    borderWidth: 2, borderColor: '#e5e7eb', backgroundColor: 'white',
  },
  filterPillActive: { backgroundColor: '#111827', borderColor: '#111827' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  filterTextActive: { color: 'white' },
  statusText: { fontSize: 13, color: '#374151', width: '100%', marginTop: 6 },
  bottomBar: {
    position: 'absolute', bottom: 30, alignSelf: 'center',
    flexDirection: 'row', gap: 12,
  },
  tripButton: {
    backgroundColor: 'white', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 30, borderWidth: 2, borderColor: '#e5e7eb',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  tripButtonText: { fontWeight: 'bold', fontSize: 15, color: '#374151' },
  reportButton: {
    backgroundColor: '#17a14e', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 30, borderWidth: 4, borderColor: 'white',
    shadowColor: '#17a14e', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  reportButtonText: { fontWeight: 'bold', fontSize: 15, color: 'white' },
});
