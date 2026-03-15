package com.transit.tracker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

@Service
public class MtaBusTimeHttpGateway implements MtaBusTimeGateway {

    private static final Logger log = LoggerFactory.getLogger(MtaBusTimeHttpGateway.class);

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final MtaBusTimeParser parser;

    @Value("${mta.bustime.api-key:}")
    private String apiKey;

    @Value("${mta.bustime.base-url}")
    private String baseUrl;

    @Value("${mta.bustime.stop-monitoring-url}")
    private String stopMonitoringUrl;

    @Autowired
    public MtaBusTimeHttpGateway(ObjectMapper objectMapper) {
        this(objectMapper, HttpClient.newHttpClient(), new MtaBusTimeParser());
    }

    MtaBusTimeHttpGateway(ObjectMapper objectMapper, HttpClient httpClient, MtaBusTimeParser parser) {
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
        this.parser = parser;
    }

    @Override
    public List<MtaStop> fetchStopsForLocation(double lat, double lng, double latSpan, double lonSpan) {
        URI uri = UriComponentsBuilder.fromUriString(baseUrl)
                .path("/stops-for-location.json")
                .queryParam("lat", lat)
                .queryParam("lon", lng)
                .queryParam("latSpan", latSpan)
                .queryParam("lonSpan", lonSpan)
                .queryParam("key", requireApiKey())
                .build(true)
                .toUri();

        return parser.parseStops(fetchJson(uri));
    }

    @Override
    public List<MtaArrival> fetchStopMonitoring(String monitoringRef) {
        URI uri = UriComponentsBuilder.fromUriString(stopMonitoringUrl)
                .queryParam("key", requireApiKey())
                .queryParam("MonitoringRef", monitoringRef)
                .queryParam("MaximumStopVisits", 12)
                .queryParam("StopMonitoringDetailLevel", "normal")
                .build(true)
                .toUri();

        return parser.parseArrivals(fetchJson(uri));
    }

    private String requireApiKey() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new MtaBusTimeException(MtaBusTimeException.Type.CONFIGURATION, "MTA_BUSTIME_API_KEY is not configured");
        }
        return apiKey;
    }

    private JsonNode fetchJson(URI uri) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(uri)
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("MTA Bus Time request failed: {} -> {}", uri, response.statusCode());
                throw new MtaBusTimeException(MtaBusTimeException.Type.UPSTREAM, "MTA Bus Time request failed");
            }

            return objectMapper.readTree(response.body());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new MtaBusTimeException(MtaBusTimeException.Type.UPSTREAM, "Unable to reach MTA Bus Time", e);
        } catch (IOException e) {
            throw new MtaBusTimeException(MtaBusTimeException.Type.UPSTREAM, "Unable to reach MTA Bus Time", e);
        }
    }
}
