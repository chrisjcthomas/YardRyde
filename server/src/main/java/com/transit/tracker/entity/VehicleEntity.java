package com.transit.tracker.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "vehicles")
public class VehicleEntity {

    @Id
    private String id;

    private String route;
    private double lat;
    private double lng;
    private boolean accessible;
    private String tripId;
    private String routeId;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public VehicleEntity() {}

    public VehicleEntity(String id, String route, double lat, double lng, boolean accessible) {
        this.id = id;
        this.route = route;
        this.lat = lat;
        this.lng = lng;
        this.accessible = accessible;
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRoute() { return route; }
    public void setRoute(String route) { this.route = route; }

    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }

    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }

    public boolean isAccessible() { return accessible; }
    public void setAccessible(boolean accessible) { this.accessible = accessible; }

    public String getTripId() { return tripId; }
    public void setTripId(String tripId) { this.tripId = tripId; }

    public String getRouteId() { return routeId; }
    public void setRouteId(String routeId) { this.routeId = routeId; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
