package com.transit.tracker.model;

import java.time.Instant;

public record NycArrival(
        String vehicleId,
        String routeId,
        String destination,
        String stopId,
        String stopName,
        int etaMinutes,
        Instant expectedArrivalTime) {
}
