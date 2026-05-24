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

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(24 * 60 * 60 * 1000L); // 24h timeout
        this.emitters.add(emitter);

        emitter.onCompletion(() -> this.emitters.remove(emitter));
        emitter.onTimeout(() -> this.emitters.remove(emitter));

        try {
            emitter.send(SseEmitter.event().name("INIT").data("Connected to Real-time Notification service"));
        } catch (IOException e) {
            this.emitters.remove(emitter);
        }

        return emitter;
    }

    public void broadcastNotification(String title, String message, String type) {
        // Save to H2 Database
        SystemNotification dbNotification = SystemNotification.builder()
                .title(title)
                .message(message)
                .type(type)
                .createdAt(java.time.LocalDateTime.now())
                .build();
        notificationRepository.save(dbNotification);

        // type: "CREATE", "ALERT", "SUCCESS", "REJECT"
        String payload = String.format("{\"id\":%d,\"title\":\"%s\",\"message\":\"%s\",\"type\":\"%s\",\"timestamp\":\"%s\"}",
                dbNotification.getId(), title, message, type, dbNotification.getCreatedAt().toString());

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("NOTIFICATION").data(payload));
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }
    }
}
