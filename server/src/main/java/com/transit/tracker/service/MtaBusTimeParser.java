package com.transit.tracker.service;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

final class MtaBusTimeParser {

    List<MtaStop> parseStops(JsonNode root) {
        JsonNode list = root.path("data").path("list");
        if (!list.isArray()) {
            return List.of();
        }

        List<MtaStop> stops = new ArrayList<>();
        for (JsonNode node : list) {
            String id = text(node.path("id"));
            String name = text(node.path("name"));
            double lat = node.path("lat").asDouble(Double.NaN);
            double lng = node.path("lon").asDouble(Double.NaN);
            if (id == null || name == null || Double.isNaN(lat) || Double.isNaN(lng)) {
                continue;
            }

            String monitoringRef = text(node.path("code"));
            if (monitoringRef == null || monitoringRef.isBlank()) {
                monitoringRef = deriveMonitoringRef(id);
            }

            List<String> routes = new ArrayList<>();
            JsonNode routeIds = node.path("routeIds");
            if (routeIds.isArray()) {
                for (JsonNode routeNode : routeIds) {
                    String routeId = normalizeRouteId(text(routeNode));
                    if (routeId != null && !routes.contains(routeId)) {
                        routes.add(routeId);
                    }
                }
            }
            routes.sort(Comparator.naturalOrder());

            stops.add(new MtaStop(id, monitoringRef, name, lat, lng, List.copyOf(routes)));
        }

        return stops;
    }

    List<MtaArrival> parseArrivals(JsonNode root) {
        JsonNode deliveries = root.path("Siri").path("ServiceDelivery").path("StopMonitoringDelivery");
        if (!deliveries.isArray() || deliveries.isEmpty()) {
            return List.of();
        }

        JsonNode visits = deliveries.get(0).path("MonitoredStopVisit");
        if (!visits.isArray()) {
            return List.of();
        }

        List<MtaArrival> arrivals = new ArrayList<>();
        for (JsonNode visit : visits) {
            JsonNode journey = visit.path("MonitoredVehicleJourney");
            JsonNode monitoredCall = journey.path("MonitoredCall");

            String vehicleId = text(journey.path("VehicleRef"));
            String routeId = normalizeRouteId(firstText(journey.path("PublishedLineName"), text(journey.path("LineRef"))));
            String destination = firstText(journey.path("DestinationName"), text(journey.path("DestinationRef")));
            String direction = text(journey.path("DirectionRef"));
            String stopId = firstText(monitoredCall.path("StopPointRef"), text(journey.path("FramedVehicleJourneyRef").path("DatedVehicleJourneyRef")));
            String stopName = firstText(monitoredCall.path("StopPointName"), text(journey.path("MonitoredCall").path("StopPointName")));
            Instant expectedArrivalTime = parseInstant(
                    firstText(monitoredCall.path("ExpectedArrivalTime"), text(monitoredCall.path("AimedArrivalTime"))));

            if (routeId == null || expectedArrivalTime == null) {
                continue;
            }

            arrivals.add(new MtaArrival(
                    vehicleId,
                    routeId,
                    destination,
                    direction,
                    stopId,
                    stopName,
                    expectedArrivalTime));
        }

        arrivals.sort(Comparator.comparing(MtaArrival::expectedArrivalTime));
        return arrivals;
    }

    static String normalizeRouteId(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }

        String cleaned = raw.trim();
        int underscoreIndex = cleaned.lastIndexOf('_');
        if (underscoreIndex >= 0 && underscoreIndex < cleaned.length() - 1) {
            cleaned = cleaned.substring(underscoreIndex + 1);
        }

        int spaceIndex = cleaned.lastIndexOf(' ');
        if (spaceIndex >= 0 && spaceIndex < cleaned.length() - 1 && cleaned.substring(spaceIndex + 1).matches("[A-Za-z0-9\\-]+")) {
            cleaned = cleaned.substring(spaceIndex + 1);
        }

        return cleaned;
    }

    static String deriveMonitoringRef(String stopId) {
        if (stopId == null || stopId.isBlank()) {
            return null;
        }

        int underscoreIndex = stopId.lastIndexOf('_');
        if (underscoreIndex >= 0 && underscoreIndex < stopId.length() - 1) {
            return stopId.substring(underscoreIndex + 1);
        }
        return stopId;
    }

    private static Instant parseInstant(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return Instant.parse(value);
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }

    private static String text(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        String value = node.asText();
        return value == null || value.isBlank() ? null : value;
    }

    private static String firstText(JsonNode node, String fallback) {
        if (node != null && node.isArray() && !node.isEmpty()) {
            String value = text(node.get(0));
            if (value != null) {
                return value;
            }
        }

        String directValue = text(node);
        return directValue != null ? directValue : fallback;
    }
}
