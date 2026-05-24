package com.seminar.logistics.repository;

import com.seminar.logistics.model.SeminarProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SeminarProfileRepository extends JpaRepository<SeminarProfile, String> {
    Optional<SeminarProfile> findByExpertToken(String expertToken);
}
