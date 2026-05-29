package com.seminar.logistics.service;

import com.seminar.logistics.model.Venue;
import com.seminar.logistics.repository.VenueRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class VenueSeedService {

    private final VenueRepository venueRepository;

    public VenueSeedService(VenueRepository venueRepository) {
        this.venueRepository = venueRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void seedVenuesIfEmpty() {
        if (venueRepository.count() > 0) {
            return;
        }

        venueRepository.saveAll(List.of(
                venue("JW Marriott Hotel Hanoi", "Hanoi", 500, "150000000.00"),
                venue("InterContinental Landmark72", "Hanoi", 800, "250000000.00"),
                venue("Sheraton Hanoi Hotel", "Hanoi", 300, "90000000.00"),
                venue("Lotte Hotel Hanoi", "Hanoi", 200, "75000000.00"),
                venue("Melia Hanoi Hotel", "Hanoi", 400, "110000000.00"),
                venue("Pullman Hanoi", "Hanoi", 250, "80000000.00"),
                venue("Pan Pacific Hanoi", "Hanoi", 350, "95000000.00"),
                venue("Hanoi Daewoo Hotel", "Hanoi", 450, "100000000.00"),
                venue("Sofitel Legend Metropole Hanoi", "Hanoi", 150, "180000000.00"),
                venue("Grand Plaza Hanoi Hotel", "Hanoi", 600, "130000000.00"),
                venue("Caravelle Saigon", "Ho Chi Minh", 250, "85000000.00"),
                venue("GEM Center", "Ho Chi Minh", 1500, "450000000.00"),
                venue("Rex Hotel Saigon", "Ho Chi Minh", 150, "50000000.00"),
                venue("Park Hyatt Saigon", "Ho Chi Minh", 300, "160000000.00"),
                venue("Sheraton Saigon Grand Opera Hotel", "Ho Chi Minh", 500, "180000000.00"),
                venue("Hotel Nikko Saigon", "Ho Chi Minh", 400, "130000000.00"),
                venue("Windsor Plaza Hotel Saigon", "Ho Chi Minh", 600, "120000000.00"),
                venue("The Reverie Saigon", "Ho Chi Minh", 200, "220000000.00"),
                venue("InterContinental Saigon", "Ho Chi Minh", 450, "190000000.00"),
                venue("New World Saigon Hotel", "Ho Chi Minh", 500, "150000000.00"),
                venue("Novotel Danang Premier Han River", "Da Nang", 400, "120000000.00"),
                venue("Furama Resort Danang", "Da Nang", 600, "180000000.00"),
                venue("Hilton Da Nang", "Da Nang", 180, "55000000.00"),
                venue("Hyatt Regency Danang Resort", "Da Nang", 500, "200000000.00"),
                venue("Pullman Danang Beach Resort", "Da Nang", 300, "110000000.00"),
                venue("InterContinental Danang Sun Peninsula", "Da Nang", 200, "300000000.00"),
                venue("Da Nang Golden Bay", "Da Nang", 800, "170000000.00"),
                venue("Grand Mercure Danang", "Da Nang", 350, "95000000.00"),
                venue("Sheraton Grand Danang Resort", "Da Nang", 700, "220000000.00")
        ));
    }

    private Venue venue(String name, String city, Integer capacity, String estimatedCost) {
        return Venue.builder()
                .name(name)
                .city(city)
                .capacity(capacity)
                .estimatedCost(new BigDecimal(estimatedCost))
                .build();
    }
}
