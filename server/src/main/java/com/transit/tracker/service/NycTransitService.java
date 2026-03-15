package com.transit.tracker.service;

import com.transit.tracker.model.NycArrival;
import com.transit.tracker.model.NycNearbyResponse;
import com.transit.tracker.model.NycOrigin;
import com.transit.tracker.model.NycStop;
import com.transit.tracker.model.NycVehicle;
import com.transit.tracker.model.Vehicle;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class NycTransitService {

    private static final double MIN_SPAN = 0.005;
    private static final double MAX_SPAN = 0.08;

    private final TransitService transitService;
    private final MtaBusTimeGateway busTimeGateway;
    private final Clock clock;
    private final Duration cacheTtl;
    private final ConcurrentHashMap<NearbyQueryKey, NearbyCacheEntry> cache = new ConcurrentHashMap<>();

    @Autowired
    public NycTransitService(
            TransitService transitService,
            MtaBusTimeGateway busTimeGateway,
            @Value("${mta.bustime.cache-ttl-ms:10000}") long cacheTtlMs) {
        this(transitService, busTimeGateway, Clock.systemUTC(), Duration.ofMillis(cacheTtlMs));
    }

    NycTransitService(TransitService transitService, MtaBusTimeGateway busTimeGateway, Clock clock, Duration cacheTtl) {
        this.transitService = transitService;
        this.busTimeGateway = busTimeGateway;
        this.clock = clock;
        this.cacheTtl = cacheTtl;
    }

    public NycNearbyResponse getNearby(double lat, double lng, double latSpan, double lonSpan, String source) {
        double safeLatSpan = clampSpan(latSpan);
        double safeLonSpan = clampSpan(lonSpan);
        Instant now = clock.instant();
        NearbyQueryKey cacheKey = new NearbyQueryKey(round(lat), round(lng), round(safeLatSpan), round(safeLonSpan));

        NearbyCacheEntry cached = cache.get(cacheKey);
        if (cached != null && cached.isFresh(now, cacheTtl)) {
            return cached.toResponse(lat, lng, source);
        }

        List<MtaStop> fetchedStops = busTimeGateway.fetchStopsForLocation(lat, lng, safeLatSpan, safeLonSpan);
        List<MtaStop> sortedStops = fetchedStops.stream()
                .sorted(Comparator.comparingDouble(stop -> distanceKm(lat, lng, stop.lat(), stop.lng())))
                .limit(20)
                .toList();

        MtaStop closestStop = sortedStops.isEmpty() ? null : sortedStops.get(0);
        List<MtaArrival> arrivals = closestStop == null
                ? List.of()
                : busTimeGateway.fetchStopMonitoring(closestStop.monitoringRef()).stream()
                        .sorted(Comparator.comparing(MtaArrival::expectedArrivalTime))
                        .limit(12)
                        .toList();

        Map<String, MtaArrival> arrivalsByVehicleId = new HashMap<>();
        for (MtaArrival arrival : arrivals) {
            if (arrival.vehicleId() != null) {
                arrivalsByVehicleId.putIfAbsent(arrival.vehicleId(), arrival);
            }
        }

        List<NycVehicle> vehicles = filterVehicles(transitService.getAllVehicles(), lat, lng, safeLatSpan, safeLonSpan, arrivalsByVehicleId);
        NearbyCacheEntry refreshed = new NearbyCacheEntry(
                now,
                sortedStops.stream().map(this::toStop).toList(),
                closestStop == null ? null : toStop(closestStop),
                vehicles,
                arrivals.stream().map(arrival -> toArrival(arrival, closestStop)).toList());
        cache.put(cacheKey, refreshed);

        return refreshed.toResponse(lat, lng, source);
    }

    private List<NycVehicle> filterVehicles(
            Collection<Vehicle> allVehicles,
            double lat,
            double lng,
            double latSpan,
            double lonSpan,
            Map<String, MtaArrival> arrivalsByVehicleId) {
        List<NycVehicle> filtered = new ArrayList<>();

        for (Vehicle vehicle : allVehicles) {
            if (!isWithinBounds(vehicle.getLat(), vehicle.getLng(), lat, lng, latSpan, lonSpan)) {
                continue;
            }

            MtaArrival arrival = arrivalsByVehicleId.get(vehicle.getId());
            String routeId = normalizeRouteId(vehicle.getRouteId() != null ? vehicle.getRouteId() : vehicle.getRoute());
            filtered.add(new NycVehicle(
                    vehicle.getId(),
                    routeId,
                    vehicle.getLat(),
                    vehicle.getLng(),
                    arrival != null ? arrival.destination() : null,
                    arrival != null ? arrival.direction() : formatDirection(vehicle.getDirection()),
                    vehicle.getTimestamp()));
        }

        filtered.sort(Comparator.comparingDouble(vehicle -> distanceKm(lat, lng, vehicle.lat(), vehicle.lng())));
        return filtered;
    }

    private NycStop toStop(MtaStop stop) {
        return new NycStop(stop.id(), stop.name(), stop.lat(), stop.lng(), stop.routes());
    }

    private NycArrival toArrival(MtaArrival arrival, MtaStop closestStop) {
        long etaSeconds = Duration.between(clock.instant(), arrival.expectedArrivalTime()).getSeconds();
        int etaMinutes = (int) Math.max(0, Math.ceil(etaSeconds / 60.0));

        return new NycArrival(
                arrival.vehicleId(),
                arrival.routeId(),
                arrival.destination(),
                closestStop != null ? closestStop.id() : arrival.stopId(),
                arrival.stopName() != null ? arrival.stopName() : closestStop != null ? closestStop.name() : null,
                etaMinutes,
                arrival.expectedArrivalTime());
    }

    private static boolean isWithinBounds(double targetLat, double targetLng, double lat, double lng, double latSpan, double lonSpan) {
        return Math.abs(targetLat - lat) <= latSpan && Math.abs(targetLng - lng) <= lonSpan;
    }

    private static double clampSpan(double span) {
        double safeSpan = Math.abs(span);
        if (safeSpan == 0) {
            safeSpan = 0.02;
        }
        return Math.max(MIN_SPAN, Math.min(MAX_SPAN, safeSpan));
    }

    private static String formatDirection(Integer direction) {
        if (direction == null) {
            return null;
        }
        return direction > 0 ? "outbound" : "inbound";
    }

    private static String normalizeRouteId(String routeId) {
        return MtaBusTimeParser.normalizeRouteId(routeId);
    }

    private static double round(double value) {
        return Math.round(value * 1000d) / 1000d;
    }

    private static double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        double earthRadiusKm = 6371d;
        double deltaLat = Math.toRadians(lat2 - lat1);
        double deltaLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
                + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.sin(deltaLng / 2)
                * Math.sin(deltaLng / 2);
        return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private record NearbyQueryKey(double lat, double lng, double latSpan, double lonSpan) {
    }

    private record NearbyCacheEntry(
            Instant updatedAt,
            List<NycStop> nearbyStops,
            NycStop closestStop,
            List<NycVehicle> vehicles,
            List<NycArrival> arrivals) {

        boolean isFresh(Instant now, Duration ttl) {
            return updatedAt.plus(ttl).isAfter(now);
        }

        NycNearbyResponse toResponse(double lat, double lng, String source) {
            return new NycNearbyResponse(
                    new NycOrigin(lat, lng, source),
                    updatedAt,
                    closestStop,
                    nearbyStops,
                    vehicles,
                    arrivals);
        }
    }
}
