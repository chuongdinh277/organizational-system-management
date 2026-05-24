package com.seminar.logistics.controller;

import com.seminar.logistics.model.Venue;
import com.seminar.logistics.service.SeminarProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/venues")
public class VenueController {

    @Autowired
    private SeminarProfileService profileService;

    @GetMapping("/suggest")
    public List<Venue> searchVenues(
            @RequestParam String city,
            @RequestParam Integer capacity) {
        return profileService.searchVenues(city, capacity);
    }
}
