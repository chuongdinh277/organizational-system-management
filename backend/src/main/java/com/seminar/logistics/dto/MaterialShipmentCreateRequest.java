package com.seminar.logistics.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;
import java.util.Map;

/** Dữ liệu đầu vào để tạo quy trình vận chuyển tài liệu. */
public record MaterialShipmentCreateRequest(
    @NotBlank String seminarType,
    @JsonAlias("eventDate") @NotNull LocalDate seminarDate,
    @JsonAlias("city") @NotBlank String seminarCity,
    @JsonAlias("expectedParticipants") @Positive int anticipatedRegistrantCount,
    @JsonAlias("actualParticipants") @Positive int registeredParticipantCount,
    @JsonAlias("hotelName") @NotBlank String venueName,
    @JsonAlias("hotelAddress") @NotBlank String venueAddress,
    @JsonAlias("materialStandards") Map<String, Integer> materialUnitRequirements) {
}
