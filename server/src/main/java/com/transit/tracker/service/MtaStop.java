package com.transit.tracker.service;

import java.util.List;

record MtaStop(
        String id,
        String monitoringRef,
        String name,
        double lat,
        double lng,
        List<String> routes) {
}
