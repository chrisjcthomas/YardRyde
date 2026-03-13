package com.transit.tracker.controller;

import com.transit.tracker.model.NycNearbyResponse;
import com.transit.tracker.service.MtaBusTimeException;
import com.transit.tracker.service.NycTransitService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/nyc")
@CrossOrigin(origins = "*")
public class NycTransitController {

    private final NycTransitService nycTransitService;

    public NycTransitController(NycTransitService nycTransitService) {
        this.nycTransitService = nycTransitService;
    }

    @GetMapping("/nearby")
    public ResponseEntity<?> nearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "0.02") double latSpan,
            @RequestParam(defaultValue = "0.02") double lonSpan,
            @RequestParam(defaultValue = "manual") String source) {
        try {
            NycNearbyResponse response = nycTransitService.getNearby(lat, lng, latSpan, lonSpan, source);
            return ResponseEntity.ok(response);
        } catch (MtaBusTimeException exception) {
            HttpStatus status = exception.getType() == MtaBusTimeException.Type.CONFIGURATION
                    ? HttpStatus.SERVICE_UNAVAILABLE
                    : HttpStatus.BAD_GATEWAY;

            return ResponseEntity.status(status).body(Map.of(
                    "type", exception.getType().name(),
                    "message", exception.getMessage()));
        }
    }
}
