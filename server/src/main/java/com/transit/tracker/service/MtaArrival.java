package com.transit.tracker.service;

import java.time.Instant;

record MtaArrival(
        String vehicleId,
        String routeId,
        String destination,
        String direction,
        String stopId,
        String stopName,
        Instant expectedArrivalTime) {
}
