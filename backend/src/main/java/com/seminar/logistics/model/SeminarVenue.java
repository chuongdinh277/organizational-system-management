package com.seminar.logistics.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "seminar_venues")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeminarVenue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seminar_profile_id", nullable = false)
    private SeminarProfile seminarProfile;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "venue_id", nullable = false)
    private Venue venue;

    @Column(nullable = false)
    private String status; // PENDING, SELECTED (chốt địa điểm), REJECTED

    // Secure token for hotel sales manager portal
    @Column(name = "sales_token", unique = true)
    private String salesToken;

    @Column(name = "sales_token_expiry")
    private LocalDateTime salesTokenExpiry;
}
