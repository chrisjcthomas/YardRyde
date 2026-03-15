package com.transit.tracker.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "reports")
public class ReportEntity {

    @Id
    private String id;

    private String type;
    private double lat;
    private double lng;

    @Column(name = "created_at")
    private Instant createdAt;

    public ReportEntity() {}

    public ReportEntity(String id, String type, double lat, double lng, Instant createdAt) {
        this.id = id;
        this.type = type;
        this.lat = lat;
        this.lng = lng;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }

    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
