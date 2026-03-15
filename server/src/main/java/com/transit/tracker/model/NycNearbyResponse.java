package com.transit.tracker.model;

import java.time.Instant;
import java.util.List;

public record NycNearbyResponse(
        NycOrigin origin,
        Instant updatedAt,
        NycStop closestStop,
        List<NycStop> nearbyStops,
        List<NycVehicle> vehicles,
        List<NycArrival> arrivals) {
}
