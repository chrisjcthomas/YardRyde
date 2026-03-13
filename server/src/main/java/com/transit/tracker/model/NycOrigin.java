package com.transit.tracker.model;

public record NycOrigin(
        double lat,
        double lng,
        String source) {
}
