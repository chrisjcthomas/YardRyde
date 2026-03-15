package com.transit.tracker.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class MtaBusTimeParserTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final MtaBusTimeParser parser = new MtaBusTimeParser();

    @Test
    void parsesNearbyStopsFromOneBusAwayPayload() throws Exception {
        String payload = """
                {
                  "code": 200,
                  "data": {
                    "list": [
                      {
                        "id": "MTA_308214",
                        "code": "308214",
                        "name": "W 42 St/7 Av",
                        "lat": 40.7581,
                        "lon": -73.9854,
                        "routeIds": ["MTA NYCT_M7", "MTA NYCT_M20"]
                      }
                    ]
                  }
                }
                """;

        List<MtaStop> stops = parser.parseStops(objectMapper.readTree(payload));

        assertEquals(1, stops.size());
        assertEquals("MTA_308214", stops.getFirst().id());
        assertEquals("308214", stops.getFirst().monitoringRef());
        assertEquals(List.of("M20", "M7"), stops.getFirst().routes());
    }

    @Test
    void parsesArrivalsFromSiriPayload() throws Exception {
        String payload = """
                {
                  "Siri": {
                    "ServiceDelivery": {
                      "StopMonitoringDelivery": [
                        {
                          "MonitoredStopVisit": [
                            {
                              "MonitoredVehicleJourney": {
                                "VehicleRef": "MTA_1234",
                                "LineRef": "MTA NYCT_M7",
                                "PublishedLineName": ["M7"],
                                "DirectionRef": "0",
                                "DestinationName": ["Downtown"],
                                "MonitoredCall": {
                                  "StopPointRef": "308214",
                                  "StopPointName": ["W 42 St/7 Av"],
                                  "ExpectedArrivalTime": "2026-03-13T12:05:00Z"
                                }
                              }
                            }
                          ]
                        }
                      ]
                    }
                  }
                }
                """;

        List<MtaArrival> arrivals = parser.parseArrivals(objectMapper.readTree(payload));

        assertEquals(1, arrivals.size());
        assertEquals("MTA_1234", arrivals.getFirst().vehicleId());
        assertEquals("M7", arrivals.getFirst().routeId());
        assertEquals("Downtown", arrivals.getFirst().destination());
        assertEquals("W 42 St/7 Av", arrivals.getFirst().stopName());
        assertEquals(Instant.parse("2026-03-13T12:05:00Z"), arrivals.getFirst().expectedArrivalTime());
        assertNotNull(arrivals.getFirst().direction());
    }
}
