package com.transit.tracker.model;

import java.time.Instant;

public class Report {

    private String id;
    private String type;
    private double lat;
    private double lng;
    private Instant timestamp;

    public Report() {}

    public Report(String id, String type, double lat, double lng) {
        this.id = id;
        this.type = type;
        this.lat = lat;
        this.lng = lng;
        this.timestamp = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }

    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
