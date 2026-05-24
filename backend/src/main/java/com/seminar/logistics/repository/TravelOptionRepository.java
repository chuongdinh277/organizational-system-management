package com.seminar.logistics.repository;

import com.seminar.logistics.model.TravelOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TravelOptionRepository extends JpaRepository<TravelOption, Long> {
    List<TravelOption> findBySeminarProfileId(String seminarProfileId);
}
