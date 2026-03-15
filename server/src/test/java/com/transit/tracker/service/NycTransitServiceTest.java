package com.transit.tracker.service;

import com.transit.tracker.model.NycNearbyResponse;
import com.transit.tracker.model.Vehicle;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class NycTransitServiceTest {

    @Test
    void returnsClosestStopNearbyArrivalsAndFilteredVehicles() {
        TransitService transitService = new TransitService();
        Vehicle nearbyVehicle = new Vehicle("bus-1", "MTA NYCT_M7", 40.7581, -73.9854);
        nearbyVehicle.setRouteId("MTA NYCT_M7");
        nearbyVehicle.setTimestamp(Instant.parse("2026-03-14T12:00:00Z"));
        transitService.addOrUpdateVehicle("bus-1", nearbyVehicle);

        Vehicle farVehicle = new Vehicle("bus-2", "MTA NYCT_B63", 40.70, -73.90);
        farVehicle.setRouteId("MTA NYCT_B63");
        transitService.addOrUpdateVehicle("bus-2", farVehicle);

        FakeGateway gateway = new FakeGateway(
                List.of(
                        new MtaStop("MTA_308214", "308214", "W 42 St/7 Av", 40.7581, -73.9854, List.of("M7")),
                        new MtaStop("MTA_999999", "999999", "Far Stop", 40.74, -73.99, List.of("B63"))
                ),
                List.of(
                        new MtaArrival("bus-1", "M7", "Downtown", "0", "308214", "W 42 St/7 Av", Instant.parse("2026-03-14T12:05:00Z"))
                )
        );

        MutableClock clock = new MutableClock(Instant.parse("2026-03-14T12:00:00Z"));
        NycTransitService service = new NycTransitService(transitService, gateway, clock, Duration.ofSeconds(10));

        NycNearbyResponse response = service.getNearby(40.7580, -73.9855, 0.02, 0.02, "gps");

        assertNotNull(response.closestStop());
        assertEquals("MTA_308214", response.closestStop().id());
        assertEquals(1, response.arrivals().size());
        assertEquals("M7", response.arrivals().getFirst().routeId());
        assertEquals(5, response.arrivals().getFirst().etaMinutes());
        assertEquals(1, response.vehicles().size());
        assertEquals("M7", response.vehicles().getFirst().routeId());
        assertEquals("gps", response.origin().source());
    }

    @Test
    void cachesNearbyQueriesForConfiguredTtl() {
        TransitService transitService = new TransitService();
        FakeGateway gateway = new FakeGateway(
                List.of(new MtaStop("MTA_308214", "308214", "W 42 St/7 Av", 40.7581, -73.9854, List.of("M7"))),
                List.of(new MtaArrival("bus-1", "M7", "Downtown", "0", "308214", "W 42 St/7 Av", Instant.parse("2026-03-14T12:05:00Z")))
        );
        MutableClock clock = new MutableClock(Instant.parse("2026-03-14T12:00:00Z"));
        NycTransitService service = new NycTransitService(transitService, gateway, clock, Duration.ofSeconds(10));

        service.getNearby(40.7580, -73.9855, 0.02, 0.02, "gps");
        service.getNearby(40.7580, -73.9855, 0.02, 0.02, "manual");

        assertEquals(1, gateway.stopFetches);
        assertEquals(1, gateway.arrivalFetches);

        clock.advance(Duration.ofSeconds(11));
        service.getNearby(40.7580, -73.9855, 0.02, 0.02, "gps");

        assertEquals(2, gateway.stopFetches);
        assertEquals(2, gateway.arrivalFetches);
    }

    private static final class FakeGateway implements MtaBusTimeGateway {
        private final List<MtaStop> stops;
        private final List<MtaArrival> arrivals;
        private int stopFetches;
        private int arrivalFetches;

        private FakeGateway(List<MtaStop> stops, List<MtaArrival> arrivals) {
            this.stops = stops;
            this.arrivals = arrivals;
        }

        @Override
        public List<MtaStop> fetchStopsForLocation(double lat, double lng, double latSpan, double lonSpan) {
            stopFetches++;
            return stops;
        }

        @Override
        public List<MtaArrival> fetchStopMonitoring(String monitoringRef) {
            arrivalFetches++;
            return arrivals;
        }
    }

    private static final class MutableClock extends Clock {
        private Instant instant;

        private MutableClock(Instant instant) {
            this.instant = instant;
        }

        @Override
        public ZoneId getZone() {
            return ZoneId.of("UTC");
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }

        private void advance(Duration duration) {
            instant = instant.plus(duration);
        }
    }
}
