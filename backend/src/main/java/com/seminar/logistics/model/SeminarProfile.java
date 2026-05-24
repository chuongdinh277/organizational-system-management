package com.seminar.logistics.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "seminar_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeminarProfile {

    @Id
    @Column(length = 50)
    private String id; // Generated like "SEM-2026-0001"

    @Column(name = "seminar_type", nullable = false)
    private String seminarType;

    @Column(name = "expected_date", nullable = false)
    private LocalDate expectedDate;

    @Column(nullable = false)
    private String city;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "expert_id", nullable = false)
    private Expert expert;

    @Column(name = "expected_attendees", nullable = false)
    private Integer expectedAttendees;

    @Column(name = "actual_attendees")
    private Integer actualAttendees;

    @Column(nullable = false)
    private String status; // Mới tạo / Chờ xử lý, Đang xử lý hậu cần, Bị từ chối / Tạm dừng, Đã chốt địa điểm, Sẵn sàng tổ chức, Đã hủy

    // Module 2 token fields
    @Column(name = "expert_token", unique = true)
    private String expertToken;

    @Column(name = "expert_token_expiry")
    private LocalDateTime expertTokenExpiry;

    @Column(name = "expert_notes", length = 1000)
    private String expertNotes; // Reason for rejection or extra notes

    @Column(name = "desired_schedule", length = 2000)
    private String desiredSchedule; // Provided by expert upon acceptance

    // Module 4 travel ticketing fields
    @Column(name = "ticket_code")
    private String ticketCode;

    // Module 5 document workflow fields
    @Column(name = "document_warning")
    private Boolean documentWarning = false;

    @Column(name = "document_shipped")
    private Boolean documentShipped = false;

    @Column(name = "document_received")
    private Boolean documentReceived = false;

    @Column(name = "document_ready")
    private Boolean documentReady = false;
}
