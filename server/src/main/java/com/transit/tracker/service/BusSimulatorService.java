package com.transit.tracker.service;

import com.transit.tracker.controller.TransitWebSocketController;
import com.transit.tracker.model.Vehicle;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
@ConditionalOnProperty(name = "transit.data-source", havingValue = "simulator", matchIfMissing = true)
public class BusSimulatorService {

    private static final Logger log = LoggerFactory.getLogger(BusSimulatorService.class);

    private final TransitService transitService;
    private final TransitWebSocketController eventHandler;
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    private final ConcurrentHashMap<String, SimBusState> simState = new ConcurrentHashMap<>();

    @Value("${simulator.update-interval:2000}")
    private int updateInterval;

    private record SimBus(String id, String route, boolean accessible) {
    }

    private static final List<SimBus> SIMULATOR_ROUTES = List.of(
            new SimBus("sim-bus-1", "800", true),
            new SimBus("sim-bus-2", "76", false),
            new SimBus("sim-bus-3", "42", true));

    private static final Map<String, double[][]> ROUTE_COORDINATES = Map.of(
            "800", new double[][] {
                    { 18.0185, -76.7975 },
                    { 18.0200, -76.8000 },
                    { 18.0150, -76.8200 },
                    { 18.0100, -76.8400 },
                    { 18.0050, -76.8600 }
            },
            "76", new double[][] {
                    { 18.0150, -76.7850 },
                    { 18.0100, -76.7900 },
                    { 18.0050, -76.7950 },
                    { 18.0000, -76.8000 }
            },
            "42", new double[][] {
                    { 18.0050, -76.7450 },
                    { 18.0100, -76.7500 },
                    { 18.0200, -76.7600 },
                    { 18.0300, -76.7700 }
            });

    private static class SimBusState {
        String id;
        String route;
        int currentIndex;
        double lat;
        double lng;
        int direction;

        SimBusState(String id, String route, double lat, double lng) {
            this.id = id;
            this.route = route;
            this.currentIndex = 0;
            this.lat = lat;
            this.lng = lng;
            this.direction = 1;
        }
    }

    public BusSimulatorService(TransitService transitService, TransitWebSocketController eventHandler) {
        this.transitService = transitService;
        this.eventHandler = eventHandler;
    }

    @PostConstruct
    public void start() {
        for (SimBus simBus : SIMULATOR_ROUTES) {
            double[][] coords = ROUTE_COORDINATES.get(simBus.route());
            simState.put(simBus.id(), new SimBusState(simBus.id(), simBus.route(), coords[0][0], coords[0][1]));
        }
        log.info("Bus simulator initialized with {} buses", SIMULATOR_ROUTES.size());

        scheduler.scheduleAtFixedRate(this::update, updateInterval, updateInterval, TimeUnit.MILLISECONDS);
        log.info("Bus simulator running (updating every {}ms)", updateInterval);
    }

    private void update() {
        try {
            simState.forEach((busId, bus) -> {
                double[][] coords = ROUTE_COORDINATES.get(bus.route);
                int nextIndex = bus.currentIndex + bus.direction;

                if (nextIndex >= coords.length) {
                    bus.direction = -1;
                    nextIndex = coords.length - 2;
                } else if (nextIndex < 0) {
                    bus.direction = 1;
                    nextIndex = 1;
                }

                bus.currentIndex = nextIndex;
                bus.lat = coords[nextIndex][0];
                bus.lng = coords[nextIndex][1];

                SimBus simBus = SIMULATOR_ROUTES.stream()
                        .filter(s -> s.id().equals(busId)).findFirst().orElse(null);
                Vehicle vehicle = new Vehicle(bus.id, bus.route, bus.lat, bus.lng);
                vehicle.setCurrentIndex(bus.currentIndex);
                vehicle.setDirection(bus.direction);
                vehicle.setAccessible(simBus != null && simBus.accessible());
                vehicle.setTripId("trip-" + bus.id);
                vehicle.setRouteId(bus.route);
                vehicle.setScheduleRelationship("SCHEDULED");
                transitService.addOrUpdateVehicle(busId, vehicle);
            });

            eventHandler.broadcastVehicleState();
        } catch (Exception e) {
            log.error("Error updating simulator", e);
        }
    }

    @PreDestroy
    public void stop() {
        scheduler.shutdown();
        for (SimBus simBus : SIMULATOR_ROUTES) {
            transitService.removeVehicle(simBus.id());
            simState.remove(simBus.id());
        }
        eventHandler.broadcastVehicleState();
        log.info("Bus simulator stopped");
    }
}
