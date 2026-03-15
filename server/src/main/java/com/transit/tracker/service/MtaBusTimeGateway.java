package com.transit.tracker.service;

import java.util.List;

public interface MtaBusTimeGateway {
    List<MtaStop> fetchStopsForLocation(double lat, double lng, double latSpan, double lonSpan);

    List<MtaArrival> fetchStopMonitoring(String monitoringRef);
}
