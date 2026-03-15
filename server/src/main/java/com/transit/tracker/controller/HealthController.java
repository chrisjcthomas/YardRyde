package com.transit.tracker.controller;

import com.transit.tracker.model.Report;
import com.transit.tracker.service.TransitService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class HealthController {

    private final TransitService transitService;

    public HealthController(TransitService transitService) {
        this.transitService = transitService;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "ok",
                "vehicles", transitService.getVehicleCount(),
                "reports", transitService.getReportCount()
        );
    }

    @GetMapping("/api/patterns")
    public Map<String, Integer> patterns() {
        return transitService.getHistoricalCounts();
    }

    @GetMapping("/api/reports/history")
    public List<Report> reportHistory(@RequestParam(defaultValue = "24") int hours) {
        return transitService.getReportHistory(hours);
    }
}
