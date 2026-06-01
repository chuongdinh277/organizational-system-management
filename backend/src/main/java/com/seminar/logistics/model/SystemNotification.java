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

    // ĐÃ GỘP: Thêm thuộc tính targetRole để phân quyền luồng nhận sự kiện SSE công việc
    @Column(name = "target_role", nullable = false)
    private String targetRole; // ALL, Role_Admin_Logistics, Role_Reservation, v.v.

    // ĐÃ GỘP: Thêm trạng thái xử lý tác vụ hậu cần sự kiện
    @Column(name = "task_status")
    private String taskStatus; // OPEN, DONE

    // ĐÃ GỘP: Liên kết mã hồ sơ hội thảo liên quan nếu có
    @Column(name = "related_profile_id")
    private String relatedProfileId;

    @Column(name = "read_at")
    private LocalDateTime readAt; // Thời điểm đánh dấu đã đọc thông báo

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}