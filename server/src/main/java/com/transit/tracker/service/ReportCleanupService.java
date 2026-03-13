package com.transit.tracker.service;

import com.transit.tracker.handler.SocketIOEventHandler;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class ReportCleanupService {

    private static final Logger log = LoggerFactory.getLogger(ReportCleanupService.class);

    private final TransitService transitService;
    private final SocketIOEventHandler eventHandler;
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    @Value("${reports.max-age-minutes:30}")
    private int maxAgeMinutes;

    public ReportCleanupService(TransitService transitService, SocketIOEventHandler eventHandler) {
        this.transitService = transitService;
        this.eventHandler = eventHandler;
    }

    @PostConstruct
    public void start() {
        scheduler.scheduleAtFixedRate(this::cleanup, 60, 60, TimeUnit.SECONDS);
        log.info("Report cleanup service started (max age: {} minutes)", maxAgeMinutes);
    }

    private void cleanup() {
        try {
            boolean removed = transitService.removeExpiredReports(Duration.ofMinutes(maxAgeMinutes));
            if (removed) {
                eventHandler.broadcastReportState();
                log.info("Expired reports removed, {} remaining", transitService.getReportCount());
            }
        } catch (Exception e) {
            log.error("Error during report cleanup", e);
        }
    }

    @PreDestroy
    public void stop() {
        scheduler.shutdown();
        log.info("Report cleanup service stopped");
    }
}
