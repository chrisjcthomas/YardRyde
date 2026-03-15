package com.transit.tracker.service;

import com.google.transit.realtime.GtfsRealtime;
import com.transit.tracker.controller.TransitWebSocketController;
import com.transit.tracker.model.Vehicle;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
@ConditionalOnProperty(name = "transit.data-source", havingValue = "mta")
public class GtfsRtFeedService {

    private static final Logger log = LoggerFactory.getLogger(GtfsRtFeedService.class);

    private final TransitService transitService;
    private final TransitWebSocketController eventHandler;
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private volatile Set<String> trackedVehicleIds = Set.of();

    @Value("${transit.mta.feed-url}")
    private String feedUrl;

    @Value("${transit.mta.api-key:}")
    private String apiKey;

    public GtfsRtFeedService(TransitService transitService, TransitWebSocketController eventHandler) {
        this.transitService = transitService;
        this.eventHandler = eventHandler;
    }

    @PostConstruct
    public void start() {
        scheduler.scheduleAtFixedRate(this::pollFeed, 0, 15, TimeUnit.SECONDS);
        log.info("GTFS-RT MTA feed service started, polling every 15 seconds");
        log.info("Feed URL: {}", feedUrl);
    }

    private void pollFeed() {
        log.info("Starting MTA GTFS-RT feed poll...");
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(feedUrl))
                    .timeout(Duration.ofSeconds(30))
                    .GET()
                    .build();

            HttpResponse<InputStream> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofInputStream());

            log.info("MTA feed HTTP status: {}", response.statusCode());

            if (response.statusCode() != 200) {
                log.warn("MTA feed returned status {}", response.statusCode());
                return;
            }

            GtfsRealtime.FeedMessage feed = GtfsRealtime.FeedMessage.parseFrom(response.body());
            int count = 0;
            Set<String> seenVehicleIds = new HashSet<>();

            for (GtfsRealtime.FeedEntity entity : feed.getEntityList()) {
                if (!entity.hasVehicle()) continue;

                GtfsRealtime.VehiclePosition vp = entity.getVehicle();
                if (!vp.hasPosition()) continue;

                String vehicleId = entity.getId();
                String routeId = vp.hasTrip() ? vp.getTrip().getRouteId() : "unknown";
                String tripId = vp.hasTrip() ? vp.getTrip().getTripId() : null;
                double lat = vp.getPosition().getLatitude();
                double lng = vp.getPosition().getLongitude();

                Vehicle vehicle = new Vehicle(vehicleId, routeId, lat, lng);
                vehicle.setTripId(tripId);
                vehicle.setRouteId(routeId);
                if (vp.hasTrip() && vp.getTrip().hasScheduleRelationship()) {
                    vehicle.setScheduleRelationship(vp.getTrip().getScheduleRelationship().name());
                }

                transitService.addOrUpdateVehicle(vehicleId, vehicle);
                seenVehicleIds.add(vehicleId);
                count++;
            }

            for (String removedVehicleId : trackedVehicleIds) {
                if (!seenVehicleIds.contains(removedVehicleId)) {
                    transitService.removeVehicle(removedVehicleId);
                }
            }
            trackedVehicleIds = seenVehicleIds;

            eventHandler.broadcastVehicleState(); // Kept original broadcast, as 'vehicles' was undefined in snippet
            log.info("Successfully processed {} vehicles from MTA feed", count); // Changed logging level and message
        } catch (Exception e) {
            log.error("Error polling MTA GTFS-RT feed: {}", e.getMessage(), e);
        }
    }

    @PreDestroy
    public void stop() {
        scheduler.shutdown();
        for (String vehicleId : trackedVehicleIds) {
            transitService.removeVehicle(vehicleId);
        }
        trackedVehicleIds = Set.of();
        log.info("GTFS-RT MTA feed service stopped");
    }
}
