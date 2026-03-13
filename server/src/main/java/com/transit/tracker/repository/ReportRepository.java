package com.transit.tracker.repository;

import com.transit.tracker.entity.ReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface ReportRepository extends JpaRepository<ReportEntity, String> {

    List<ReportEntity> findByCreatedAtAfter(Instant cutoff);

    void deleteByCreatedAtBefore(Instant cutoff);
}
