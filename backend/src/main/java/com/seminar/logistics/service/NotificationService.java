package com.seminar.logistics.service;

import com.seminar.logistics.model.SystemNotification;
import com.seminar.logistics.repository.SystemNotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class NotificationService {

    @Autowired
    private SystemNotificationRepository notificationRepository;

    // ĐÃ GỘP: Chuyển sang quản lý kết nối bằng Record ClientEmitter theo đúng Git Diff bạn gửi
    private final List<ClientEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe(String role) {
        SseEmitter emitter = new SseEmitter(24 * 60 * 60 * 1000L); // 24h timeout
        ClientEmitter clientEmitter = new ClientEmitter(emitter, normalizeRole(role));
        this.emitters.add(clientEmitter);

        emitter.onCompletion(() -> this.emitters.remove(clientEmitter));
        emitter.onTimeout(() -> this.emitters.remove(clientEmitter));

        try {
            emitter.send(SseEmitter.event().name("INIT").data("Connected to Real-time Notification service"));
        } catch (IOException e) {
            this.emitters.remove(clientEmitter);
        }

        return emitter;
    }

    public void broadcastNotification(String title, String message, String type) {
        broadcastNotification(title, message, type, "ALL", null);
    }

    public void broadcastNotification(String title, String message, String type, String targetRole, String relatedProfileId) {
        SystemNotification dbNotification = SystemNotification.builder()
                .title(title)
                .message(message)
                .type(type)
                .targetRole(normalizeRole(targetRole))
                .relatedProfileId(relatedProfileId)
                .taskStatus("OPEN")
                .createdAt(java.time.LocalDateTime.now())
                .build();
        notificationRepository.save(dbNotification);

        // ĐÃ GỘP: Format chuỗi JSON Payload an toàn kèm bộ lọc escapeJson chống lỗi parse chuỗi
        String payload = String.format(
                "{\"id\":%d,\"title\":\"%s\",\"message\":\"%s\",\"type\":\"%s\",\"targetRole\":\"%s\",\"relatedProfileId\":%s,\"taskStatus\":\"%s\",\"readAt\":%s,\"timestamp\":\"%s\"}",
                dbNotification.getId(),
                escapeJson(title),
                escapeJson(message),
                escapeJson(type),
                escapeJson(dbNotification.getTargetRole()),
                dbNotification.getRelatedProfileId() == null ? "null" : "\"" + escapeJson(dbNotification.getRelatedProfileId()) + "\"",
                escapeJson(dbNotification.getTaskStatus()),
                dbNotification.getReadAt() == null ? "null" : "\"" + dbNotification.getReadAt().toString() + "\"",
                dbNotification.getCreatedAt().toString());

        // Duyệt danh sách ClientEmitter để đẩy dữ liệu thời gian thực có phân quyền
        for (ClientEmitter clientEmitter : emitters) {
            if (!isVisibleToRole(dbNotification.getTargetRole(), clientEmitter.role())) {
                continue;
            }
            try {
                clientEmitter.emitter().send(SseEmitter.event().name("NOTIFICATION").data(payload));
            } catch (Exception e) {
                emitters.remove(clientEmitter);
            }
        }
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return "ALL";
        }
        return role;
    }

    private boolean isVisibleToRole(String targetRole, String currentRole) {
        return targetRole == null || "ALL".equals(targetRole) || targetRole.equals(currentRole);
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    // ĐÃ GỘP: Khai báo cấu trúc record lưu giữ kết nối và vai trò người dùng ngầm
    private record ClientEmitter(SseEmitter emitter, String role) {}
}