package com.seminar.logistics.controller;

import com.seminar.logistics.model.*;
import com.seminar.logistics.repository.*;
import com.seminar.logistics.service.SeminarProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/external")
public class ExternalController {

    @Autowired
    private SeminarProfileService profileService;

    @Autowired
    private SeminarProfileRepository profileRepository;

    @Autowired
    private SeminarVenueRepository seminarVenueRepository;

    @Autowired
    private ContractVersionRepository contractVersionRepository;

    @Autowired
    private TravelOptionRepository travelOptionRepository;

    // Expert Portal - Get Profile
    @GetMapping("/expert")
    public ResponseEntity<?> getExpertProfile(@RequestParam String token) {
        return profileRepository.findByExpertToken(token)
                .<ResponseEntity<?>>map(profile -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("id", profile.getId());
                    data.put("seminarType", profile.getSeminarType());
                    data.put("expectedDate", profile.getExpectedDate());
                    data.put("city", profile.getCity());
                    data.put("expectedAttendees", profile.getExpectedAttendees());
                    data.put("status", profile.getStatus());
                    data.put("desiredSchedule", profile.getDesiredSchedule());
                    data.put("expertNotes", profile.getExpertNotes());
                    data.put("ticketCode", profile.getTicketCode());
                    data.put("expertName", profile.getExpert().getName());

                    List<TravelOption> travelOpts = travelOptionRepository.findBySeminarProfileId(profile.getId());
                    data.put("travelOptions", travelOpts);

                    return ResponseEntity.ok(data);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("Token không hợp lệ hoặc hồ sơ không tồn tại"));
    }

    // Expert Portal - Accept
    @PostMapping("/expert/accept")
    public ResponseEntity<?> acceptInvite(@RequestParam String token, @RequestBody Map<String, String> payload) {
        try {
            String schedule = payload.get("desiredSchedule");
            String confirmedDateStr = payload.get("confirmedDate");
            if (schedule == null || schedule.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Lịch trình mong muốn là bắt buộc");
            }

            java.time.LocalDate confirmedDate = null;
            if (confirmedDateStr != null && !confirmedDateStr.trim().isEmpty()) {
                confirmedDate = java.time.LocalDate.parse(confirmedDateStr);
            }

            SeminarProfile profile = profileService.acceptInvitation(token, schedule, confirmedDate);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Expert Portal - Reject
    @PostMapping("/expert/reject")
    public ResponseEntity<?> rejectInvite(@RequestParam String token, @RequestBody Map<String, String> payload) {
        try {
            String reason = payload.get("reason");
            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Lý do từ chối là bắt buộc");
            }
            SeminarProfile profile = profileService.rejectInvitation(token, reason);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Expert Portal - Pick Travel
    @PostMapping("/expert/choose-flight")
    public ResponseEntity<?> chooseFlight(@RequestParam String token, @RequestParam Long optionId) {
        try {
            TravelOption option = profileService.chooseTravelOption(token, optionId);
            return ResponseEntity.ok(option);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Hotel Sales Portal - Get Profile
    // Hotel Sales Portal - Get Profile
    @GetMapping("/sales")
    public ResponseEntity<?> getSalesProfile(@RequestParam String token) {
        return seminarVenueRepository.findBySalesToken(token)
                .<ResponseEntity<?>>map(sv -> {
                    SeminarProfile profile = sv.getSeminarProfile();
                    Map<String, Object> data = new HashMap<>();
                    data.put("id", sv.getId());
                    data.put("profileId", profile.getId());
                    data.put("seminarType", profile.getSeminarType());
                    data.put("expectedDate", profile.getExpectedDate());
                    data.put("expectedAttendees", profile.getExpectedAttendees());
                    data.put("venueName", sv.getVenue().getName());
                    data.put("venueCity", sv.getVenue().getCity());
                    data.put("estimatedCost", sv.getVenue().getEstimatedCost());
                    data.put("status", sv.getStatus());
                    data.put("documentShipped", profile.getDocumentShipped());
                    data.put("documentReceived", profile.getDocumentReceived());

                    // Nạp dự toán kĩ thuật phòng họp tự động làm nền tảng ban đầu
                    Map<String, String> estimate = profileService.getResourceEstimation(profile.getId());

                    // ĐỌC VÀ GHI ĐÈ DỮ LIỆU ĐIỀN TAY BAN ĐẦU CỦA ADMIN TỪ CONTRACT_VERSIONS
                    List<ContractVersion> versions = contractVersionRepository.findBySeminarProfileIdOrderByVersionDesc(profile.getId());
                    if (versions != null && !versions.isEmpty()) {
                        // Lấy bản ghi đầu tiên được tạo (v1) nằm ở cuối danh sách sắp xếp giảm dần
                        ContractVersion rootContract = versions.get(versions.size() - 1);
                        if ("ADMIN".equals(rootContract.getUploadedBy()) && rootContract.getNotes() != null) {
                            String notes = rootContract.getNotes();
                            try {
                                if (notes.contains("Diện tích:") && notes.contains("| Setup:")) {
                                    String size = notes.substring(notes.indexOf("Diện tích:") + 10, notes.indexOf("| Setup:")).trim().replace("m2", "");
                                    String style = notes.substring(notes.indexOf("| Setup:") + 8).trim();
                                    
                                    // Ép đè thông số điền tay lên dữ liệu truyền sang Portal Sales
                                    estimate.put("minRoomSize", size);
                                    estimate.put("setupStyle", style);
                                }
                            } catch (Exception e) {
                                System.err.println("Lỗi phân tách thông số điền tay: " + e.getMessage());
                            }

                            if (rootContract.getFileContent() != null) {
                                String customAvText = new String(rootContract.getFileContent(), java.nio.charset.StandardCharsets.UTF_8);
                                estimate.put("avEquipment", customAvText);
                            }
                        }
                    }
                    
                    data.put("estimation", estimate);
                    data.put("contracts", versions);

                    return ResponseEntity.ok(data);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("Sales token không hợp lệ"));
    }

    // Hotel Sales Portal - Respond (Agree / Disagree)
    @PostMapping("/sales/respond")
    public ResponseEntity<?> respondVenueBooking(
            @RequestParam String token,
            @RequestParam boolean agree,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) MultipartFile file) {
        try {
            byte[] fileBytes = null;
            String fileName = null;

            if (agree) {
                if (file == null || file.isEmpty()) {
                    return ResponseEntity.badRequest().body("Bạn phải tải lên dự thảo hợp đồng khi đồng ý đặt phòng");
                }
                fileBytes = file.getBytes();
                fileName = file.getOriginalFilename();
            }

            SeminarVenue sv = profileService.handleSalesResponse(token, agree, reason, fileBytes, fileName);
            return ResponseEntity.ok(sv);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Hotel Sales Portal - Upload contract revision
    @PostMapping("/sales/contract/revision")
    public ResponseEntity<?> uploadContractRevision(
            @RequestParam("token") String token,
            @RequestParam("notes") String notes,
            @RequestParam("uploadedBy") String uploadedBy,
            @RequestParam("file") MultipartFile file) {
        try {
            SeminarVenue sv = seminarVenueRepository.findBySalesToken(token)
                    .orElseThrow(() -> new IllegalArgumentException("Token mã hóa không hợp lệ hoặc đã hết hạn!"));

            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body("Lỗi: Vui lòng đính kèm tệp hợp đồng chỉnh sửa hợp lệ!");
            }

            // Thực hiện lưu trữ file và nâng version tự động thông qua Service
            ContractVersion cv = profileService.submitContractRevision(
                    sv.getSeminarProfile().getId(),
                    file.getBytes(),
                    file.getOriginalFilename(),
                    notes,
                    uploadedBy
            );
            return ResponseEntity.ok(cv);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi hệ thống lưu trữ: " + e.getMessage());
        }
    }

    // Hotel Sales Portal - Confirm delivery
    @PostMapping("/sales/confirm-delivery")
    public ResponseEntity<?> confirmDelivery(@RequestParam String token) {
        try {
            SeminarProfile profile = profileService.confirmDeliveryBySales(token);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Contract Download Endpoint
    @GetMapping("/contract/{id}/download")
    public ResponseEntity<byte[]> downloadContract(@PathVariable Long id) {
        ContractVersion cv = contractVersionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Contract version not found"));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", cv.getFileName());
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(cv.getFileContent(), headers, HttpStatus.OK);
    }
}