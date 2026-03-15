package com.transit.tracker.model;

import java.time.Instant;

public class Vehicle {

    private String id;
    private String route;
    private double lat;
    private double lng;
    private Instant timestamp;
    private Integer currentIndex;
    private Integer direction;
    private boolean accessible;
    private String tripId;
    private String routeId;
    private String scheduleRelationship;

    public Vehicle() {}

    public Vehicle(String id, String route, double lat, double lng) {
        this.id = id;
        this.route = route;
        this.lat = lat;
        this.lng = lng;
        this.timestamp = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRoute() { return route; }
    public void setRoute(String route) { this.route = route; }

    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }

    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public Integer getCurrentIndex() { return currentIndex; }
    public void setCurrentIndex(Integer currentIndex) { this.currentIndex = currentIndex; }

    public Integer getDirection() { return direction; }
    public void setDirection(Integer direction) { this.direction = direction; }

    public boolean isAccessible() { return accessible; }
    public void setAccessible(boolean accessible) { this.accessible = accessible; }

    public String getTripId() { return tripId; }
    public void setTripId(String tripId) { this.tripId = tripId; }

    public String getRouteId() { return routeId; }
    public void setRouteId(String routeId) { this.routeId = routeId; }

    public String getScheduleRelationship() { return scheduleRelationship; }
    public void setScheduleRelationship(String scheduleRelationship) { this.scheduleRelationship = scheduleRelationship; }
}
