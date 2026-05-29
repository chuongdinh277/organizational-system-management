package com.seminar.logistics.controller;

import com.seminar.logistics.model.SystemNotification;
import com.seminar.logistics.repository.SystemNotificationRepository;
import com.seminar.logistics.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SystemNotificationRepository notificationRepository;

    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@RequestParam(value = "role", defaultValue = "ALL") String role) {
        return notificationService.subscribe(role);
    }

    @GetMapping
    public List<SystemNotification> getNotifications(
            @RequestHeader(value = "X-Role", defaultValue = "Role_Admin_Logistics") String role) {
        return notificationRepository.findVisibleForRole(role);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @RequestHeader(value = "X-Role", defaultValue = "Role_Admin_Logistics") String role,
            @PathVariable Long id) {
        return notificationRepository.findById(id)
                .map(notification -> {
                    if (!isVisibleToRole(notification.getTargetRole(), role)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bạn không có quyền cập nhật thông báo này.");
                    }
                    notification.setReadAt(LocalDateTime.now());
                    return ResponseEntity.ok(notificationRepository.save(notification));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/done")
    public ResponseEntity<?> markAsDone(
            @RequestHeader(value = "X-Role", defaultValue = "Role_Admin_Logistics") String role,
            @PathVariable Long id) {
        return notificationRepository.findById(id)
                .map(notification -> {
                    if (!isVisibleToRole(notification.getTargetRole(), role)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bạn không có quyền hoàn tất task này.");
                    }
                    notification.setTaskStatus("DONE");
                    notification.setReadAt(LocalDateTime.now());
                    return ResponseEntity.ok(notificationRepository.save(notification));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private boolean isVisibleToRole(String targetRole, String currentRole) {
        return targetRole == null || "ALL".equals(targetRole) || targetRole.equals(currentRole);
    }
}
