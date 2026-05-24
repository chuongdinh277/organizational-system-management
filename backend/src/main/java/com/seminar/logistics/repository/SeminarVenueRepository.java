package com.seminar.logistics.repository;

import com.seminar.logistics.model.SeminarVenue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SeminarVenueRepository extends JpaRepository<SeminarVenue, Long> {
    Optional<SeminarVenue> findBySalesToken(String salesToken);
    List<SeminarVenue> findBySeminarProfileId(String seminarProfileId);
}
