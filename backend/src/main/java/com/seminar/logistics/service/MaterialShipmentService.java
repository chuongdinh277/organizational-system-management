package com.seminar.logistics.service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import com.seminar.logistics.dto.MaterialQuantityResponse;
import com.seminar.logistics.dto.MaterialShipmentCreateRequest;
import com.seminar.logistics.dto.ShipmentReportRequest;
import com.seminar.logistics.model.MaterialShipment;
import com.seminar.logistics.model.SeminarStatus;
import com.seminar.logistics.repository.MaterialShipmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class MaterialShipmentService {
  // Cảnh báo quản trị viên trước ngày hội thảo 14 ngày.
  private static final int MATERIAL_ALERT_WINDOW_DAYS = 14;

  private final MaterialShipmentRepository materialShipmentRepository;
  private final TransportSlipPdfGenerator transportSlipPdfGenerator;
  // Nguồn thời gian tách riêng để kiểm thử quy tắc cảnh báo.
  private final Clock clock;

  @Autowired
  public MaterialShipmentService(
      MaterialShipmentRepository materialShipmentRepository,
      TransportSlipPdfGenerator transportSlipPdfGenerator) {
    this(materialShipmentRepository, transportSlipPdfGenerator, Clock.systemDefaultZone());
  }

  MaterialShipmentService(
      MaterialShipmentRepository materialShipmentRepository,
      TransportSlipPdfGenerator transportSlipPdfGenerator,
      Clock clock) {
    this.materialShipmentRepository = materialShipmentRepository;
    this.transportSlipPdfGenerator = transportSlipPdfGenerator;
    this.clock = clock;
  }

  /** Tạo quy trình tài liệu từ thông tin đặt lịch và địa điểm. */
  public MaterialShipment createMaterialShipment(MaterialShipmentCreateRequest request) {
    MaterialShipment materialShipment = new MaterialShipment();
    materialShipment.setWorkflowId("PUB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
    materialShipment.setSeminarType(request.seminarType());
    materialShipment.setSeminarDate(request.seminarDate());
    materialShipment.setSeminarCity(request.seminarCity());
    materialShipment.setAnticipatedRegistrantCount(request.anticipatedRegistrantCount());
    materialShipment.setRegisteredParticipantCount(request.registeredParticipantCount());
    materialShipment.setVenueName(request.venueName());
    materialShipment.setVenueAddress(request.venueAddress());
    materialShipment.setMaterialUnitRequirements(resolveMaterialUnitRequirements(request.materialUnitRequirements()));
    materialShipment.setStatus(SeminarStatus.VENUE_CONFIRMED);
    markMaterialShipmentCreated(materialShipment);
    applyMaterialPreparationAlert(materialShipment);
    return materialShipmentRepository.save(materialShipment);
  }

  /** Trả về danh sách quy trình sau khi cập nhật cờ cảnh báo. */
  public List<MaterialShipment> findAllMaterialShipments() {
    refreshMaterialPreparationAlerts();
    return materialShipmentRepository.findAll();
  }

  /** Tìm quy trình theo mã, báo lỗi nếu không tồn tại. */
  public MaterialShipment findMaterialShipmentById(String workflowId) {
    refreshMaterialPreparationAlerts();
    return materialShipmentRepository.findById(workflowId)
        .orElseThrow(() -> new NoSuchElementException("Không tìm thấy hồ sơ: " + workflowId));
  }

  /** Tính số lượng ấn phẩm theo số người đăng ký thực tế. */
  public MaterialQuantityResponse calculateMaterialQuantities(String workflowId) {
    MaterialShipment materialShipment = findMaterialShipmentById(workflowId);
    Map<String, Integer> materialQuantities = new LinkedHashMap<>();
    for (Map.Entry<String, Integer> materialRequirement : materialShipment.getMaterialUnitRequirements().entrySet()) {
      materialQuantities.put(
          materialRequirement.getKey(),
          materialShipment.getRegisteredParticipantCount() * materialRequirement.getValue());
    }
    materialShipment.setMaterialQuantities(materialQuantities);
    materialShipment.setStatus(SeminarStatus.MATERIALS_CALCULATED);
    markMaterialShipmentUpdated(materialShipment);
    return new MaterialQuantityResponse(
        materialShipment.getWorkflowId(),
        materialShipment.getSeminarDate(),
        materialShipment.getRegisteredParticipantCount(),
        materialShipment.getMaterialQuantities(),
        materialShipment.getStatus());
  }

  /** Tạo PDF phiếu đóng gói và vận chuyển cho bộ phận tài liệu. */
  public byte[] createTransportSlipPdf(String workflowId) {
    MaterialShipment materialShipment = findMaterialShipmentById(workflowId);
    if (materialShipment.getMaterialQuantities().isEmpty()) {
      calculateMaterialQuantities(workflowId);
    }
    materialShipment.setTransportSlipCreated(true);
    materialShipment.setStatus(SeminarStatus.TRANSPORT_SLIP_CREATED);
    markMaterialShipmentUpdated(materialShipment);
    return transportSlipPdfGenerator.createTransportSlipPdf(materialShipment);
  }

  /** Ghi nhận bộ phận tài liệu đã gửi hàng. */
  public MaterialShipment reportMaterialsShipment(String workflowId, ShipmentReportRequest request) {
    MaterialShipment materialShipment = findMaterialShipmentById(workflowId);
    if (!materialShipment.isTransportSlipCreated()) {
      throw new IllegalStateException("Cần tạo phiếu vận chuyển trước khi ghi nhận đã gửi hàng.");
    }
    materialShipment.setMaterialsShipmentReported(true);
    materialShipment.setShipmentTrackingCode(request.shipmentTrackingCode());
    materialShipment.setStatus(SeminarStatus.MATERIALS_SHIPPED);
    markMaterialShipmentUpdated(materialShipment);
    return materialShipment;
  }

  /** Xác nhận địa điểm đã nhận tài liệu được vận chuyển. */
  public MaterialShipment confirmVenueDelivery(String workflowId) {
    MaterialShipment materialShipment = findMaterialShipmentById(workflowId);
    if (!materialShipment.isMaterialsShipmentReported()) {
      throw new IllegalStateException("Cần có báo cáo đã gửi hàng trước khi địa điểm xác nhận nhận hàng.");
    }
    materialShipment.setVenueDeliveryConfirmed(true);
    materialShipment.setStatus(SeminarStatus.VENUE_RECEIVED);
    markMaterialShipmentUpdated(materialShipment);
    return materialShipment;
  }

  /** Đóng quy trình sau khi đã gửi hàng và địa điểm xác nhận nhận. */
  public MaterialShipment completeMaterialShipment(String workflowId) {
    MaterialShipment materialShipment = findMaterialShipmentById(workflowId);
    if (!materialShipment.isMaterialsShipmentReported() || !materialShipment.isVenueDeliveryConfirmed()) {
      throw new IllegalStateException(
          "Chỉ được hoàn tất khi bộ phận tài liệu đã báo gửi hàng và địa điểm đã xác nhận nhận hàng.");
    }
    materialShipment.setStatus(SeminarStatus.READY_TO_ORGANIZE);
    materialShipment.setCompletedAt(Instant.now(clock));
    markMaterialShipmentUpdated(materialShipment);
    return materialShipment;
  }

  /** Kiểm tra quy trình có cần cảnh báo chuẩn bị tài liệu không. */
  public boolean isMaterialPreparationAlertRequired(String workflowId) {
    return findMaterialShipmentById(workflowId).isMaterialPreparationAlert();
  }

  /** Cập nhật cảnh báo tài liệu mỗi sáng cho hội thảo sắp diễn ra. */
  @Scheduled(cron = "0 0 7 * * *", zone = "Asia/Ho_Chi_Minh")
  public void refreshMaterialPreparationAlerts() {
    for (MaterialShipment materialShipment : materialShipmentRepository.findAll()) {
      applyMaterialPreparationAlert(materialShipment);
    }
  }

  /** Bật cảnh báo 14 ngày khi chưa tính số lượng tài liệu. */
  private void applyMaterialPreparationAlert(MaterialShipment materialShipment) {
    long daysUntilSeminar = ChronoUnit.DAYS.between(LocalDate.now(clock), materialShipment.getSeminarDate());
    boolean shouldAlert =
        daysUntilSeminar <= MATERIAL_ALERT_WINDOW_DAYS
            && materialShipment.getStatus().ordinal() < SeminarStatus.MATERIALS_CALCULATED.ordinal();
    if (shouldAlert) {
      materialShipment.setMaterialPreparationAlert(true);
      materialShipment.setStatus(SeminarStatus.MATERIALS_ALERTED);
      markMaterialShipmentUpdated(materialShipment);
    }
  }

  /** Dùng định mức được gửi lên hoặc mặc định mỗi người một bộ. */
  private Map<String, Integer> resolveMaterialUnitRequirements(
      Map<String, Integer> requestedMaterialUnitRequirements) {
    Map<String, Integer> materialUnitRequirements = new LinkedHashMap<>();
    if (requestedMaterialUnitRequirements != null && !requestedMaterialUnitRequirements.isEmpty()) {
      for (Map.Entry<String, Integer> materialRequirement : requestedMaterialUnitRequirements.entrySet()) {
        if (materialRequirement.getValue() == null || materialRequirement.getValue() <= 0) {
          throw new IllegalArgumentException("Định mức ấn phẩm phải lớn hơn 0: " + materialRequirement.getKey());
        }
        materialUnitRequirements.put(materialRequirement.getKey(), materialRequirement.getValue());
      }
      return materialUnitRequirements;
    }
    materialUnitRequirements.put("Sách tài liệu", 1);
    materialUnitRequirements.put("Tờ rơi", 1);
    materialUnitRequirements.put("Thẻ tên", 1);
    materialUnitRequirements.put("Bút viết", 1);
    return materialUnitRequirements;
  }

  /** Gán thời gian khi quy trình được tạo lần đầu. */
  private void markMaterialShipmentCreated(MaterialShipment materialShipment) {
    Instant currentTime = Instant.now(clock);
    materialShipment.setCreatedAt(currentTime);
    materialShipment.setUpdatedAt(currentTime);
  }

  /** Cập nhật thời gian sửa sau khi đổi trạng thái. */
  private void markMaterialShipmentUpdated(MaterialShipment materialShipment) {
    materialShipment.setUpdatedAt(Instant.now(clock));
  }
}
