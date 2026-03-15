package com.transit.tracker.model;

public class ReportRequest {

    private String type;
    private double lat;
    private double lng;

    public ReportRequest() {}

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }

    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }
}
