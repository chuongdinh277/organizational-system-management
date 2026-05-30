package com.seminar.logistics.dto;

import java.time.LocalDate;
import java.util.Map;
import com.seminar.logistics.model.SeminarStatus;

/** Dữ liệu trả về sau khi tính số lượng ấn phẩm. */
public record MaterialQuantityResponse(
    String workflowId,
    LocalDate seminarDate,
    int registeredParticipantCount,
    Map<String, Integer> materialQuantities,
    SeminarStatus status) {
}
