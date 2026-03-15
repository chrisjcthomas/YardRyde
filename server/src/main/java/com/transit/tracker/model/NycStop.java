package com.transit.tracker.model;

import java.util.List;

public record NycStop(
        String id,
        String name,
        double lat,
        double lng,
        List<String> routes) {
}
