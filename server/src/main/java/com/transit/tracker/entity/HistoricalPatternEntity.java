package com.transit.tracker.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "historical_patterns", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"report_type", "hour_of_day"})
})
public class HistoricalPatternEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_type")
    private String reportType;

    @Column(name = "hour_of_day")
    private int hourOfDay;

    @Column(name = "count")
    private int count;

    public HistoricalPatternEntity() {}

    public HistoricalPatternEntity(String reportType, int hourOfDay, int count) {
        this.reportType = reportType;
        this.hourOfDay = hourOfDay;
        this.count = count;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getReportType() { return reportType; }
    public void setReportType(String reportType) { this.reportType = reportType; }

    public int getHourOfDay() { return hourOfDay; }
    public void setHourOfDay(int hourOfDay) { this.hourOfDay = hourOfDay; }

    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }

    public void incrementCount() { this.count++; }
}
