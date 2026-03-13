package com.transit.tracker.handler;

import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.ConnectListener;
import com.corundumstudio.socketio.listener.DataListener;
import com.corundumstudio.socketio.listener.DisconnectListener;
import com.transit.tracker.model.Report;
import com.transit.tracker.model.ReportRequest;
import com.transit.tracker.service.TransitService;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.ArrayList;

@Component
public class SocketIOEventHandler {

    private static final Logger log = LoggerFactory.getLogger(SocketIOEventHandler.class);

    private final SocketIOServer server;
    private final TransitService transitService;

    public SocketIOEventHandler(SocketIOServer server, TransitService transitService) {
        this.server = server;
        this.transitService = transitService;
    }

    @PostConstruct
    public void init() {
        server.addConnectListener(onConnect());
        server.addDisconnectListener(onDisconnect());
        server.addEventListener("rider:subscribe", Object.class, onRiderSubscribe());
        server.addEventListener("report:create", ReportRequest.class, onReportCreate());

        server.start();
        log.info("Socket.IO server started on port {}", server.getConfiguration().getPort());
        log.info("WebSocket endpoint: ws://localhost:{}", server.getConfiguration().getPort());
    }

    private ConnectListener onConnect() {
        return client -> {
            log.info("Client connected: {}", client.getSessionId());
            client.sendEvent("vehicles:state", new ArrayList<>(transitService.getAllVehicles()));
            client.sendEvent("reports:state", transitService.getAllReports());
        };
    }

    private DisconnectListener onDisconnect() {
        return client -> {
            log.info("Client disconnected: {}", client.getSessionId());
        };
    }

    private DataListener<Object> onRiderSubscribe() {
        return (client, data, ackRequest) -> {
            client.sendEvent("vehicles:state", new ArrayList<>(transitService.getAllVehicles()));
            client.sendEvent("reports:state", transitService.getAllReports());
        };
    }

    private DataListener<ReportRequest> onReportCreate() {
        return (client, data, ackRequest) -> {
            Report report = new Report(
                    "report-" + System.currentTimeMillis(),
                    data.getType(),
                    data.getLat(),
                    data.getLng());
            transitService.addReport(report);
            transitService.recordHistoricalReport(data.getType(), LocalTime.now().getHour());
            broadcastReportState();
            log.info("Report created: {} at [{}, {}]", data.getType(), data.getLat(), data.getLng());
        };
    }

    public void broadcastVehicleState() {
        server.getBroadcastOperations().sendEvent("vehicles:state", new ArrayList<>(transitService.getAllVehicles()));
    }

    public void broadcastReportState() {
        server.getBroadcastOperations().sendEvent("reports:state", transitService.getAllReports());
    }
}
