package com.seminar.logistics.repository;

import com.seminar.logistics.model.Venue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VenueRepository extends JpaRepository<Venue, Long> {
    List<Venue> findByCityContainingIgnoreCaseAndCapacityGreaterThanEqual(String city, Integer capacity);
}
