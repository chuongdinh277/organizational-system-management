package com.seminar.logistics.controller;

import com.seminar.logistics.model.SystemNotification;
import com.seminar.logistics.repository.SystemNotificationRepository;
import com.seminar.logistics.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SystemNotificationRepository notificationRepository;

    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe() {
        return notificationService.subscribe();
    }

    @GetMapping
    public List<SystemNotification> getNotifications() {
        return notificationRepository.findAllByOrderByCreatedAtDesc();
    }
}
