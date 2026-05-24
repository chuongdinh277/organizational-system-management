package com.seminar.logistics.model;

import com.seminar.logistics.security.AesBytesEncryptor;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "contract_versions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seminar_profile_id", nullable = false)
    private SeminarProfile seminarProfile;

    @Column(nullable = false)
    private Integer version; // Incremental version number (1, 2, ...)

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Lob
    @Convert(converter = AesBytesEncryptor.class)
    @Column(name = "file_content", nullable = false, columnDefinition = "LONGBLOB")
    private byte[] fileContent; // Economic contract file encrypted using AES-256

    @Column(length = 2000)
    private String notes; // Notes / request edits

    @Column(name = "uploaded_by", nullable = false)
    private String uploadedBy; // SALES, ADMIN

    @Column(nullable = false)
    private String status; // DRAFT, REJECTED, APPROVED

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
