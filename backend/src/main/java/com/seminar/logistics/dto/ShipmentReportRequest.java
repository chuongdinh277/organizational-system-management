package com.seminar.logistics.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

/** Dữ liệu khi bộ phận tài liệu báo đã gửi hàng. */
public record ShipmentReportRequest(@JsonAlias("shippingReportCode") @NotBlank String shipmentTrackingCode) {
}
