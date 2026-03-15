package com.transit.tracker.model;

import java.time.Instant;

public record NycVehicle(
        String id,
        String routeId,
        double lat,
        double lng,
        String destination,
        String direction,
        Instant timestamp) {
}
