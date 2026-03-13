package com.transit.tracker.controller;

import com.google.transit.realtime.GtfsRealtime;
import com.transit.tracker.model.Vehicle;
import com.transit.tracker.service.TransitService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "*")
public class GtfsRtController {

    private final TransitService transitService;

    public GtfsRtController(TransitService transitService) {
        this.transitService = transitService;
    }

    @GetMapping(value = "/api/gtfs-rt/vehicle-positions", produces = "application/x-protobuf")
    public ResponseEntity<byte[]> vehiclePositions() {
        GtfsRealtime.FeedMessage.Builder feedBuilder = GtfsRealtime.FeedMessage.newBuilder();

        GtfsRealtime.FeedHeader.Builder headerBuilder = GtfsRealtime.FeedHeader.newBuilder();
        headerBuilder.setGtfsRealtimeVersion("2.0");
        headerBuilder.setTimestamp(System.currentTimeMillis() / 1000);
        feedBuilder.setHeader(headerBuilder);

        for (Vehicle vehicle : transitService.getAllVehicles()) {
            GtfsRealtime.FeedEntity.Builder entityBuilder = GtfsRealtime.FeedEntity.newBuilder();
            entityBuilder.setId(vehicle.getId());

            GtfsRealtime.VehiclePosition.Builder vpBuilder = GtfsRealtime.VehiclePosition.newBuilder();

            GtfsRealtime.Position.Builder posBuilder = GtfsRealtime.Position.newBuilder();
            posBuilder.setLatitude((float) vehicle.getLat());
            posBuilder.setLongitude((float) vehicle.getLng());
            vpBuilder.setPosition(posBuilder);

            if (vehicle.getTripId() != null || vehicle.getRouteId() != null) {
                GtfsRealtime.TripDescriptor.Builder tripBuilder = GtfsRealtime.TripDescriptor.newBuilder();
                if (vehicle.getTripId() != null) tripBuilder.setTripId(vehicle.getTripId());
                if (vehicle.getRouteId() != null) tripBuilder.setRouteId(vehicle.getRouteId());
                if (vehicle.getScheduleRelationship() != null) {
                    try {
                        tripBuilder.setScheduleRelationship(
                                GtfsRealtime.TripDescriptor.ScheduleRelationship.valueOf(vehicle.getScheduleRelationship()));
                    } catch (IllegalArgumentException ignored) {}
                }
                vpBuilder.setTrip(tripBuilder);
            }

            GtfsRealtime.VehicleDescriptor.Builder vdBuilder = GtfsRealtime.VehicleDescriptor.newBuilder();
            vdBuilder.setId(vehicle.getId());
            vdBuilder.setLabel("Route " + vehicle.getRoute());
            vpBuilder.setVehicle(vdBuilder);

            vpBuilder.setTimestamp(vehicle.getTimestamp().getEpochSecond());

            entityBuilder.setVehicle(vpBuilder);
            feedBuilder.addEntity(entityBuilder);
        }

        byte[] bytes = feedBuilder.build().toByteArray();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/x-protobuf"))
                .body(bytes);
    }
}
