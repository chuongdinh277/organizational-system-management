package com.seminar.logistics.repository;

import com.seminar.logistics.model.ContractVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractVersionRepository extends JpaRepository<ContractVersion, Long> {
    List<ContractVersion> findBySeminarProfileIdOrderByVersionDesc(String seminarProfileId);
    Optional<ContractVersion> findFirstBySeminarProfileIdOrderByVersionDesc(String seminarProfileId);
}
