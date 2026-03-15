package com.transit.tracker.repository;

import com.transit.tracker.entity.HistoricalPatternEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HistoricalPatternRepository extends JpaRepository<HistoricalPatternEntity, Long> {

    Optional<HistoricalPatternEntity> findByReportTypeAndHourOfDay(String reportType, int hourOfDay);
}
