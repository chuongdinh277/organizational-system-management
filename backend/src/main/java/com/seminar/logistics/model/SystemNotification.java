package com.seminar.logistics.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "system_notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(nullable = false)
    private String type; // CREATE, ALERT, SUCCESS, REJECT

    @Column(name = "target_role")
    private String targetRole; // ALL, Role_Reservation, Role_Admin_Logistics, Role_Doc_Processor

    @Column(name = "related_profile_id")
    private String relatedProfileId;

    @Column(name = "task_status", nullable = false)
    private String taskStatus; // OPEN, DONE

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
