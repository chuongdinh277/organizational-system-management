package com.seminar.logistics.model;

/** Các trạng thái hậu cần hội thảo và vận chuyển tài liệu. */
public enum SeminarStatus {
  NEW,
  PROCESSING_LOGISTICS,
  VENUE_CONFIRMED,
  MATERIALS_ALERTED,
  MATERIALS_CALCULATED,
  TRANSPORT_SLIP_CREATED,
  MATERIALS_SHIPPED,
  VENUE_RECEIVED,
  READY_TO_ORGANIZE
}
