package com.seminar.logistics.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class SchedulerService {

    @Autowired
    private SeminarProfileService profileService;

    // F5.1 - Countdown scheduler running every night at midnight: "0 0 0 * * ?"
    // For manual and easy testing, let's configure a shorter polling or keep it standard.
    @Scheduled(cron = "0 0 0 * * ?")
    public void run14DayCountdownJob() {
        System.out.println("Running daily 14-day countdown checks for seminar profiles...");
        profileService.check14DaysCountdown();
    }
}
