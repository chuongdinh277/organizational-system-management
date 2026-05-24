package com.seminar.logistics.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "travel_options")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TravelOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seminar_profile_id", nullable = false)
    private SeminarProfile seminarProfile;

    @Column(name = "flight_details", nullable = false, length = 1000)
    private String flightDetails;

    @Column(name = "estimated_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal estimatedCost;

    @Column(nullable = false)
    private String status; // PENDING, SELECTED, REJECTED
}
