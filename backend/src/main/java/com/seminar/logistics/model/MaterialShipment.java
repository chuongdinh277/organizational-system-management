package com.seminar.logistics.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

/** Lưu trạng thái của quy trình vận chuyển tài liệu ấn phẩm. */
public class MaterialShipment {
  private String workflowId;
  private String seminarType;
  private LocalDate seminarDate;
  private String seminarCity;
  private int anticipatedRegistrantCount;
  private int registeredParticipantCount;
  private String venueName;
  private String venueAddress;
  // Định mức từng loại ấn phẩm cho mỗi người tham dự.
  private Map<String, Integer> materialUnitRequirements = new LinkedHashMap<>();
  private Map<String, Integer> materialQuantities = new LinkedHashMap<>();
  private boolean materialPreparationAlert;
  private boolean transportSlipCreated;
  private boolean materialsShipmentReported;
  private boolean venueDeliveryConfirmed;
  private String shipmentTrackingCode;
  private SeminarStatus status = SeminarStatus.NEW;
  private Instant createdAt;
  private Instant updatedAt;
  private Instant completedAt;

  public String getWorkflowId() {
    return workflowId;
  }

  public void setWorkflowId(String workflowId) {
    this.workflowId = workflowId;
  }

  public String getSeminarType() {
    return seminarType;
  }

  public void setSeminarType(String seminarType) {
    this.seminarType = seminarType;
  }

  public LocalDate getSeminarDate() {
    return seminarDate;
  }

  public void setSeminarDate(LocalDate seminarDate) {
    this.seminarDate = seminarDate;
  }

  public String getSeminarCity() {
    return seminarCity;
  }

  public void setSeminarCity(String seminarCity) {
    this.seminarCity = seminarCity;
  }

  public int getAnticipatedRegistrantCount() {
    return anticipatedRegistrantCount;
  }

  public void setAnticipatedRegistrantCount(int anticipatedRegistrantCount) {
    this.anticipatedRegistrantCount = anticipatedRegistrantCount;
  }

  public int getRegisteredParticipantCount() {
    return registeredParticipantCount;
  }

  public void setRegisteredParticipantCount(int registeredParticipantCount) {
    this.registeredParticipantCount = registeredParticipantCount;
  }

  public String getVenueName() {
    return venueName;
  }

  public void setVenueName(String venueName) {
    this.venueName = venueName;
  }

  public String getVenueAddress() {
    return venueAddress;
  }

  public void setVenueAddress(String venueAddress) {
    this.venueAddress = venueAddress;
  }

  public Map<String, Integer> getMaterialUnitRequirements() {
    return materialUnitRequirements;
  }

  public void setMaterialUnitRequirements(Map<String, Integer> materialUnitRequirements) {
    this.materialUnitRequirements = materialUnitRequirements;
  }

  public Map<String, Integer> getMaterialQuantities() {
    return materialQuantities;
  }

  public void setMaterialQuantities(Map<String, Integer> materialQuantities) {
    this.materialQuantities = materialQuantities;
  }

  public boolean isMaterialPreparationAlert() {
    return materialPreparationAlert;
  }

  public void setMaterialPreparationAlert(boolean materialPreparationAlert) {
    this.materialPreparationAlert = materialPreparationAlert;
  }

  public boolean isTransportSlipCreated() {
    return transportSlipCreated;
  }

  public void setTransportSlipCreated(boolean transportSlipCreated) {
    this.transportSlipCreated = transportSlipCreated;
  }

  public boolean isMaterialsShipmentReported() {
    return materialsShipmentReported;
  }

  public void setMaterialsShipmentReported(boolean materialsShipmentReported) {
    this.materialsShipmentReported = materialsShipmentReported;
  }

  public boolean isVenueDeliveryConfirmed() {
    return venueDeliveryConfirmed;
  }

  public void setVenueDeliveryConfirmed(boolean venueDeliveryConfirmed) {
    this.venueDeliveryConfirmed = venueDeliveryConfirmed;
  }

  public String getShipmentTrackingCode() {
    return shipmentTrackingCode;
  }

  public void setShipmentTrackingCode(String shipmentTrackingCode) {
    this.shipmentTrackingCode = shipmentTrackingCode;
  }

  public SeminarStatus getStatus() {
    return status;
  }

  public void setStatus(SeminarStatus status) {
    this.status = status;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }

  public Instant getCompletedAt() {
    return completedAt;
  }

  public void setCompletedAt(Instant completedAt) {
    this.completedAt = completedAt;
  }
}
