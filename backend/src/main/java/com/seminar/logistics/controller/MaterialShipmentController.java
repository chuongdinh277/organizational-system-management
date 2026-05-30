package com.seminar.logistics.controller;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import com.seminar.logistics.dto.MaterialQuantityResponse;
import com.seminar.logistics.dto.MaterialShipmentCreateRequest;
import com.seminar.logistics.dto.ShipmentReportRequest;
import com.seminar.logistics.model.MaterialShipment;
import com.seminar.logistics.service.MaterialShipmentService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/material-shipments", "/api/publication-workflows"})
public class MaterialShipmentController {
  private final MaterialShipmentService materialShipmentService;

  public MaterialShipmentController(MaterialShipmentService materialShipmentService) {
    this.materialShipmentService = materialShipmentService;
  }

  /** Tạo quy trình tài liệu mới cho hội thảo đã lên lịch. */
  @PostMapping
  public ResponseEntity<MaterialShipment> createMaterialShipment(
      @Valid @RequestBody MaterialShipmentCreateRequest request) {
    MaterialShipment materialShipment = materialShipmentService.createMaterialShipment(request);
    return ResponseEntity
        .created(URI.create("/api/material-shipments/" + materialShipment.getWorkflowId()))
        .body(materialShipment);
  }

  /** Lấy danh sách tất cả quy trình tài liệu. */
  @GetMapping
  public List<MaterialShipment> findAllMaterialShipments() {
    return materialShipmentService.findAllMaterialShipments();
  }

  /** Lấy một quy trình theo mã. */
  @GetMapping("/{workflowId}")
  public MaterialShipment findMaterialShipmentById(@PathVariable("workflowId") String workflowId) {
    return materialShipmentService.findMaterialShipmentById(workflowId);
  }

  /** Kiểm tra có cần cảnh báo chuẩn bị tài liệu không. */
  @GetMapping("/{workflowId}/material-alert")
  public Map<String, Object> materialPreparationAlert(@PathVariable("workflowId") String workflowId) {
    return Map.of(
        "workflowId",
        workflowId,
        "alert",
        materialShipmentService.isMaterialPreparationAlertRequired(workflowId));
  }

  /** Tính số lượng ấn phẩm cho quy trình. */
  @PostMapping("/{workflowId}/calculate-materials")
  public MaterialQuantityResponse calculateMaterialQuantities(
      @PathVariable("workflowId") String workflowId) {
    return materialShipmentService.calculateMaterialQuantities(workflowId);
  }

  /** Tải xuống PDF phiếu vận chuyển đã tạo. */
  @GetMapping(value = "/{workflowId}/transport-slip.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
  public ResponseEntity<byte[]> downloadTransportSlip(@PathVariable("workflowId") String workflowId) {
    byte[] pdfBytes = materialShipmentService.createTransportSlipPdf(workflowId);
    HttpHeaders responseHeaders = new HttpHeaders();
    responseHeaders.setContentDisposition(
        ContentDisposition.attachment().filename(workflowId + "-transport-slip.pdf").build());
    responseHeaders.setContentType(MediaType.APPLICATION_PDF);
    return new ResponseEntity<>(pdfBytes, responseHeaders, HttpStatus.OK);
  }

  /** Ghi nhận thông báo đã gửi hàng từ bộ phận tài liệu. */
  @PostMapping("/{workflowId}/shipping-report")
  public MaterialShipment reportMaterialsShipment(
      @PathVariable("workflowId") String workflowId,
      @Valid @RequestBody ShipmentReportRequest request) {
    return materialShipmentService.reportMaterialsShipment(workflowId, request);
  }

  /** Xác nhận địa điểm đã nhận tài liệu. */
  @PostMapping({"/{workflowId}/venue-delivery-confirmation", "/{workflowId}/hotel-confirmation"})
  public MaterialShipment confirmVenueDelivery(@PathVariable("workflowId") String workflowId) {
    return materialShipmentService.confirmVenueDelivery(workflowId);
  }

  /** Hoàn tất quy trình sau khi gửi hàng và xác nhận nhận hàng. */
  @PostMapping("/{workflowId}/complete")
  public MaterialShipment completeMaterialShipment(@PathVariable("workflowId") String workflowId) {
    return materialShipmentService.completeMaterialShipment(workflowId);
  }

  /** Chuyển lỗi không tìm thấy quy trình thành HTTP 404. */
  @ExceptionHandler(NoSuchElementException.class)
  public ResponseEntity<ProblemDetail> handleNotFound(NoSuchElementException exception) {
    ProblemDetail problemDetail =
        ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problemDetail);
  }

  /** Chuyển thao tác quy trình không hợp lệ thành HTTP 400. */
  @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
  public ResponseEntity<ProblemDetail> handleBadRequest(RuntimeException exception) {
    ProblemDetail problemDetail =
        ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
    return ResponseEntity.badRequest().body(problemDetail);
  }
}
