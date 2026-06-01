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

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/seminars")
public class SeminarProfileController {

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

    // F1.1 & F1.2 - Create Request (Requires Role_Reservation)
    @PostMapping
    public ResponseEntity<?> createSeminar(
            @RequestHeader(value = "X-Role", defaultValue = "Role_Reservation") String role,
            @RequestBody Map<String, Object> payload) {
        
        // RBAC Enforcement
        if (!"Role_Reservation".equals(role) && !"Role_Admin_Logistics".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bạn không có quyền khởi tạo hồ sơ!");
        }

        try {
            String seminarType = (String) payload.get("seminarType");
            LocalDate expectedDate = LocalDate.parse((String) payload.get("expectedDate"));
            String city = (String) payload.get("city");
            String expertName = (String) payload.get("expertName");
            String expertEmail = (String) payload.get("expertEmail");
            String expertPhone = (String) payload.get("expertPhone");
            String expertPassport = (String) payload.get("expertPassport");
            Integer expectedAttendees = (Integer) payload.get("expectedAttendees");

            if (seminarType == null || expectedDate == null || city == null || 
                expertName == null || expertEmail == null || expertPassport == null || expectedAttendees == null) {
                return ResponseEntity.badRequest().body("Thiếu thông tin bắt buộc!");
            }

            SeminarProfile profile = profileService.createProfile(
                    seminarType, expectedDate, city,
                    expertName, expertEmail, expertPhone, expertPassport, expectedAttendees
            );
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Get all profiles (Both roles)
    @GetMapping
    public List<SeminarProfile> getAllSeminars() {
        return profileRepository.findAll();
    }

    // Get single profile (Both roles)
    @GetMapping("/{id}")
    public ResponseEntity<SeminarProfile> getSeminarById(@PathVariable String id) {
        return profileRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update Profile - Enforces F107: BP Đặt chỗ can only edit profiles that are rejected
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSeminar(
            @RequestHeader(value = "X-Role", defaultValue = "Role_Reservation") String role,
            @PathVariable String id,
            @RequestBody Map<String, Object> payload) {

        SeminarProfile profile = profileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        // RBAC rule checking
        if ("Role_Reservation".equals(role)) {
            // F107: "Chỉ có quyền Thêm mới, Hủy hoặc Cập nhật hồ sơ đang bị từ chối. Không được sửa/xóa hồ sơ đang được hậu cần xử lý."
            if (!"Bị từ chối / Tạm dừng".equals(profile.getStatus()) && !"Mới tạo / Chờ xử lý".equals(profile.getStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("BP Đặt chỗ không được chỉnh sửa hồ sơ đang xử lý hậu cần!");
            }
        }

        try {
            if (payload.containsKey("seminarType")) profile.setSeminarType((String) payload.get("seminarType"));
            if (payload.containsKey("expectedDate")) profile.setExpectedDate(LocalDate.parse((String) payload.get("expectedDate")));
            if (payload.containsKey("city")) profile.setCity((String) payload.get("city"));
            if (payload.containsKey("expectedAttendees")) profile.setExpectedAttendees((Integer) payload.get("expectedAttendees"));
            
            // If the profile was rejected, BP Đặt chỗ can update details and set it back to "Mới tạo / Chờ xử lý" to rerun
            if ("Bị từ chối / Tạm dừng".equals(profile.getStatus()) && "Role_Reservation".equals(role)) {
                profile.setStatus("Mới tạo / Chờ xử lý");
            }

            SeminarProfile updated = profileRepository.save(profile);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // F108: HARD DELETE IS STRICTLY FORBIDDEN to ensure audit trail!
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSeminar() {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body("Xóa cứng (Hard Delete) bị nghiêm cấm trên hệ thống để đảm bảo lưu vết kiểm toán dữ liệu.");
    }

    // Soft cancel request (BP Đặt chỗ or Admin)
    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelSeminar(
            @RequestHeader(value = "X-Role", defaultValue = "Role_Reservation") String role,
            @PathVariable String id) {
        
        SeminarProfile profile = profileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        if ("Role_Reservation".equals(role)) {
            if (!"Bị từ chối / Tạm dừng".equals(profile.getStatus()) && !"Mới tạo / Chờ xử lý".equals(profile.getStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("BP Đặt chỗ không thể hủy hồ sơ đang trong hậu cần!");
            }
        }

        profile.setStatus("Đã hủy");
        profileRepository.save(profile);
        return ResponseEntity.ok(profile);
    }

    // F2.1 - Send invite to Expert (Only Admin Logistics or BP Đặt chỗ)
    @PostMapping("/{id}/invite")
    public ResponseEntity<?> inviteExpert(@PathVariable String id) {
        try {
            SeminarProfile profile = profileService.sendExpertInvitation(id);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // F3.1 - Resource estimate (For Admin review)
    @GetMapping("/{id}/estimate")
    public ResponseEntity<?> getEstimate(@PathVariable String id) {
        try {
            return ResponseEntity.ok(profileService.getResourceEstimation(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // F3.3 - ĐÃ SỬA CHI TIẾT: Tiếp nhận thêm các thông số kỹ thuật điền tay tự do gửi lên từ Modal đối sánh
    // F3.3 - Send room booking request (Admin Logistics only)
    @PostMapping("/{id}/book")
    public ResponseEntity<?> bookVenue(
            @RequestHeader(value = "X-Role", defaultValue = "Role_Admin_Logistics") String role,
            @PathVariable String id,
            @RequestParam Long venueId,
            @RequestParam(required = false) String minRoomSize,
            @RequestParam(required = false) String setupStyle,
            @RequestParam(required = false) String avEquipment) {
        
        if (!"Role_Admin_Logistics".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chỉ Điều phối viên (Admin) mới có quyền đặt phòng!");
        }

        try {
            // Đã truyền bổ sung 3 tham số kỹ thuật điền tay xuống tầng Service xử lý
            SeminarVenue sv = profileService.requestVenueBooking(id, venueId, minRoomSize, setupStyle, avEquipment);
            return ResponseEntity.ok(sv);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // F3.4 - Admin uploads contract revision
    @PostMapping("/{id}/contract/revision")
    public ResponseEntity<?> adminUploadRevision(
            @RequestHeader(value = "X-Role", defaultValue = "Role_Admin_Logistics") String role,
            @PathVariable String id,
            @RequestParam String notes,
            @RequestParam MultipartFile file) {

        if (!"Role_Admin_Logistics".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chỉ Điều phối viên (Admin) mới được tải lên tài liệu sửa đổi!");
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("Tệp tin tải lên không được rỗng!");
        }

        try {
            ContractVersion cv = profileService.submitContractRevision(id, file.getBytes(), file.getOriginalFilename(), notes, "ADMIN");
            return ResponseEntity.ok(cv);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // F3.5 - Approve Contract (Admin Logistics only)
    @PostMapping("/{id}/approve-contract")
    public ResponseEntity<?> approveContract(
            @RequestHeader(value = "X-Role", defaultValue = "Role_Admin_Logistics") String role,
            @PathVariable String id) {
        
        if (!"Role_Admin_Logistics".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chỉ Điều phối viên (Admin) mới có quyền phê duyệt hợp đồng!");
        }

        try {
            SeminarProfile profile = profileService.approveContract(id);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // F4.1 - Propose travel options (Admin Logistics only)
    @PostMapping("/{id}/travel")
    public ResponseEntity<?> proposeTravel(
            @RequestHeader(value = "X-Role", defaultValue = "Role_Admin_Logistics") String role,
            @PathVariable String id,
            @RequestBody List<Map<String, String>> flights) {

        if (!"Role_Admin_Logistics".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chỉ Điều phối viên (Admin) mới có quyền thiết lập phương án di chuyển!");
        }

        try {
            List<TravelOption> saved = profileService.proposeTravelOptions(id, flights);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // F4.3 - Update flight code (Admin Logistics only)
    @PostMapping("/{id}/ticket")
    public ResponseEntity<?> updateTicket(
            @RequestHeader(value = "X-Role", defaultValue = "Role_Admin_Logistics") String role,
            @PathVariable String id,
            @RequestParam String ticketCode) {

        if (!"Role_Admin_Logistics".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chỉ Điều phối viên (Admin) mới có quyền cập nhật vé máy bay!");
        }

        try {
            SeminarProfile profile = profileService.updateTicketCode(id, ticketCode);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // F4.2 & F4.3 - Sync & simulated book flight via API (Admin Logistics only)
    @PostMapping("/{id}/book-flight-api")
    public ResponseEntity<?> bookFlightViaApi(
            @RequestHeader(value = "X-Role", defaultValue = "Role_Admin_Logistics") String role,
            @PathVariable String id) {

        if (!"Role_Admin_Logistics".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chỉ Điều phối viên (Admin) mới có quyền gọi API đặt vé!");
        }

        try {
            SeminarProfile profile = profileService.bookFlightViaApi(id);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // F5.1 - Manual countdown trigger (for demo)
    @PostMapping("/check-countdown")
    public ResponseEntity<?> checkCountdown() {
        return ResponseEntity.ok(profileService.check14DaysCountdown());
    }

    // F5.2 & F5.3 - Finalize documents & export shipping PDF
    @PostMapping("/{id}/finalize-docs")
    public ResponseEntity<?> finalizeDocs(
            @RequestHeader(value = "X-Role", defaultValue = "Role_Admin_Logistics") String role,
            @PathVariable String id,
            @RequestParam Integer actualAttendees) {

        if (!"Role_Admin_Logistics".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chỉ Điều phối viên (Admin) mới có quyền kết xuất tài liệu!");
        }

        try {
            Map<String, Object> result = profileService.finalizeDocuments(id, actualAttendees);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // F5.3 - BP Tai lieu confirms documents are ready
    @PostMapping("/{id}/doc-ready")
    public ResponseEntity<?> docReady(@PathVariable String id) {
        try {
            SeminarProfile profile = profileService.markDocumentReady(id);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // F5.4 - Complete workflow
    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeLogistics(
            @RequestHeader(value = "X-Role", defaultValue = "Role_Admin_Logistics") String role,
            @PathVariable String id,
            @RequestParam boolean hotelConfirmed) {

        if (!"Role_Admin_Logistics".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chỉ Điều phối viên (Admin) mới có quyền chốt hoàn tất quy trình!");
        }

        try {
            SeminarProfile profile = profileService.completeLogistics(id, hotelConfirmed);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Get negotiated contract history (Both roles)
    @GetMapping("/{id}/contracts")
    public List<ContractVersion> getContracts(@PathVariable String id) {
        return contractVersionRepository.findBySeminarProfileIdOrderByVersionDesc(id);
    }

    // Get proposed flight options (Both roles)
    @GetMapping("/{id}/travel")
    public List<TravelOption> getTravelOptions(@PathVariable String id) {
        return travelOptionRepository.findBySeminarProfileId(id);
    }

    // Get proposed venues (Both roles)
    @GetMapping("/{id}/venues")
    public ResponseEntity<?> getProposedVenues(@PathVariable String id) {
        List<SeminarVenue> list = seminarVenueRepository.findBySeminarProfileId(id);
        List<Map<String, Object>> result = new ArrayList<>();
        for (SeminarVenue sv : list) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", sv.getId());
            map.put("venueId", sv.getVenue().getId());
            map.put("venueName", sv.getVenue().getName());
            map.put("venueCity", sv.getVenue().getCity());
            map.put("estimatedCost", sv.getVenue().getEstimatedCost());
            map.put("status", sv.getStatus());
            map.put("salesToken", sv.getSalesToken());
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }
}