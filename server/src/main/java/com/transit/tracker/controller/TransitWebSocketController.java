package com.transit.tracker.controller;

import com.transit.tracker.model.Report;
import com.transit.tracker.model.ReportRequest;
import com.transit.tracker.service.TransitService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Controller
public class TransitWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(TransitWebSocketController.class);

    private final TransitService transitService;
    private final SimpMessagingTemplate messagingTemplate;

    public TransitWebSocketController(TransitService transitService, SimpMessagingTemplate messagingTemplate) {
        this.transitService = transitService;
        this.messagingTemplate = messagingTemplate;
    }

    @SubscribeMapping("/topic/vehicles")
    public Collection<com.transit.tracker.model.Vehicle> onSubscribeVehicles() {
        log.info("New subscription to /topic/vehicles");
        return transitService.getAllVehicles();
    }

    @SubscribeMapping("/topic/reports")
    public List<Report> onSubscribeReports() {
        log.info("New subscription to /topic/reports");
        return transitService.getAllReports();
    }

    @MessageMapping("/rider:subscribe")
    public void onRiderSubscribe() {
        log.info("Rider subscribed via /app/rider:subscribe");
        broadcastVehicleState();
        broadcastReportState();
    }

    @MessageMapping("/report:create")
    public void onReportCreate(ReportRequest data) {
        Report report = new Report(
                "report-" + System.currentTimeMillis(),
                data.getType(),
                data.getLat(),
                data.getLng());
        transitService.addReport(report);
        transitService.recordHistoricalReport(data.getType(), LocalTime.now().getHour());
        broadcastReportState();
        log.info("Report created: {} at [{}, {}]", data.getType(), data.getLat(), data.getLng());
    }

    public void broadcastVehicleState() {
        messagingTemplate.convertAndSend("/topic/vehicles", new ArrayList<>(transitService.getAllVehicles()));
    }

    public void broadcastReportState() {
        messagingTemplate.convertAndSend("/topic/reports", transitService.getAllReports());
    }
}
