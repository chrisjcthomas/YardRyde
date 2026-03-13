package com.transit.tracker.service;

import com.transit.tracker.entity.HistoricalPatternEntity;
import com.transit.tracker.entity.ReportEntity;
import com.transit.tracker.entity.VehicleEntity;
import com.transit.tracker.model.Report;
import com.transit.tracker.model.Vehicle;
import com.transit.tracker.repository.HistoricalPatternRepository;
import com.transit.tracker.repository.ReportRepository;
import com.transit.tracker.repository.VehicleRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TransitService {

    private static final Logger log = LoggerFactory.getLogger(TransitService.class);

    private final ConcurrentHashMap<String, Vehicle> vehicles = new ConcurrentHashMap<>();
    private final List<Report> reports = new ArrayList<>();
    private final Map<String, Integer> historicalCounts = new ConcurrentHashMap<>();

    @Autowired(required = false)
    private VehicleRepository vehicleRepository;

    @Autowired(required = false)
    private ReportRepository reportRepository;

    @Autowired(required = false)
    private HistoricalPatternRepository patternRepository;

    public TransitService() {
    }

    @PostConstruct
    public void seedFromDatabase() {
        if (reportRepository == null || patternRepository == null) {
            log.info("Running in memory-only mode (no database configured)");
            return;
        }
        try {
            List<ReportEntity> dbReports = reportRepository.findByCreatedAtAfter(
                    Instant.now().minus(Duration.ofMinutes(30)));
            synchronized (this) {
                for (ReportEntity entity : dbReports) {
                    reports.add(new Report(entity.getId(), entity.getType(), entity.getLat(), entity.getLng()));
                }
            }

            for (HistoricalPatternEntity pattern : patternRepository.findAll()) {
                historicalCounts.put(pattern.getReportType() + ":" + pattern.getHourOfDay(), pattern.getCount());
            }

            log.info("Seeded {} reports and {} patterns from database", dbReports.size(), historicalCounts.size());
        } catch (Exception e) {
            log.warn("Could not seed from database (DB may be unavailable): {}", e.getMessage());
        }
    }

    public void addOrUpdateVehicle(String vehicleId, Vehicle vehicle) {
        vehicles.put(vehicleId, vehicle);
        persistVehicleAsync(vehicle);
    }

    public void removeVehicle(String vehicleId) {
        vehicles.remove(vehicleId);
        deleteVehicleAsync(vehicleId);
    }

    public boolean hasVehicle(String vehicleId) {
        return vehicles.containsKey(vehicleId);
    }

    public Collection<Vehicle> getAllVehicles() {
        return vehicles.values();
    }

    public int getVehicleCount() {
        return vehicles.size();
    }

    public synchronized void addReport(Report report) {
        reports.add(report);
        persistReportAsync(report);
    }

    public synchronized List<Report> getAllReports() {
        return new ArrayList<>(reports);
    }

    public synchronized int getReportCount() {
        return reports.size();
    }

    public synchronized boolean removeExpiredReports(Duration maxAge) {
        Instant cutoff = Instant.now().minus(maxAge);
        boolean removed = reports.removeIf(r -> r.getTimestamp().isBefore(cutoff));
        if (removed) {
            deleteExpiredReportsAsync(cutoff);
        }
        return removed;
    }

    public synchronized void recordHistoricalReport(String type, int hour) {
        String key = type + ":" + hour;
        historicalCounts.merge(key, 1, (a, b) -> a + b);
        persistPatternAsync(type, hour);
    }

    public Map<String, Integer> getHistoricalCounts() {
        return new HashMap<>(historicalCounts);
    }

    public List<Report> getReportHistory(int hours) {
        if (reportRepository == null) {
            return getAllReports();
        }
        try {
            Instant since = Instant.now().minus(Duration.ofHours(hours));
            return reportRepository.findByCreatedAtAfter(since).stream()
                    .map(e -> new Report(e.getId(), e.getType(), e.getLat(), e.getLng()))
                    .toList();
        } catch (Exception e) {
            log.warn("Could not fetch report history: {}", e.getMessage());
            return getAllReports();
        }
    }

    @Async
    protected void persistVehicleAsync(Vehicle vehicle) {
        if (vehicleRepository == null)
            return;
        try {
            VehicleEntity entity = new VehicleEntity(
                    vehicle.getId(), vehicle.getRoute(),
                    vehicle.getLat(), vehicle.getLng(), vehicle.isAccessible());
            entity.setTripId(vehicle.getTripId());
            entity.setRouteId(vehicle.getRouteId());
            vehicleRepository.save(entity);
        } catch (Exception e) {
            log.debug("Vehicle persist skipped: {}", e.getMessage());
        }
    }

    @Async
    protected void deleteVehicleAsync(String vehicleId) {
        if (vehicleRepository == null || vehicleId == null)
            return;
        try {
            vehicleRepository.deleteById(vehicleId);
        } catch (Exception e) {
            log.debug("Vehicle delete skipped: {}", e.getMessage());
        }
    }

    @Async
    protected void persistReportAsync(Report report) {
        if (reportRepository == null)
            return;
        try {
            reportRepository.save(new ReportEntity(
                    report.getId(), report.getType(),
                    report.getLat(), report.getLng(), report.getTimestamp()));
        } catch (Exception e) {
            log.debug("Report persist skipped: {}", e.getMessage());
        }
    }

    @Async
    protected void deleteExpiredReportsAsync(Instant cutoff) {
        if (reportRepository == null)
            return;
        try {
            reportRepository.deleteByCreatedAtBefore(cutoff);
        } catch (Exception e) {
            log.debug("Expired report cleanup skipped: {}", e.getMessage());
        }
    }

    @Async
    protected void persistPatternAsync(String type, int hour) {
        if (patternRepository == null)
            return;
        try {
            HistoricalPatternEntity pattern = patternRepository
                    .findByReportTypeAndHourOfDay(type, hour)
                    .orElse(new HistoricalPatternEntity(type, hour, 0));
            pattern.incrementCount();
            patternRepository.save(pattern);
        } catch (Exception e) {
            log.debug("Pattern persist skipped: {}", e.getMessage());
        }
    }
}
