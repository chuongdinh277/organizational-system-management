package com.seminar.logistics.service;

import com.seminar.logistics.model.*;
import com.seminar.logistics.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class SeminarProfileService {

    @Autowired
    private SeminarProfileRepository profileRepository;

    @Autowired
    private ExpertRepository expertRepository;

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private SeminarVenueRepository seminarVenueRepository;

    @Autowired
    private ContractVersionRepository contractVersionRepository;

    @Autowired
    private TravelOptionRepository travelOptionRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PdfExportService pdfExportService;

    @Autowired
    private NotificationService notificationService;

    // F1.1 - CHỈ DÙNG KHI KHỞI TẠO MỚI HỒ SƠ (Tạo Chuyên gia độc lập hoàn toàn)
    public SeminarProfile createProfile(String seminarType, LocalDate expectedDate, String city,
                                         String expertName, String expertEmail, String expertPhone, String expertPassport,
                                         Integer expectedAttendees) {

        // Kiểm tra xem email chuyên gia đã tồn tại trong hệ thống chưa
        Optional<Expert> existingExpertOpt = expertRepository.findByEmail(expertEmail);
        Expert expert;

        if (existingExpertOpt.isPresent()) {
            // Nếu đã tồn tại, tái sử dụng thực thể Chuyên gia này để tránh lỗi trùng Unique Key khi tạo hội thảo mới
            expert = existingExpertOpt.get();
        } else {
            // Nếu chưa tồn tại, tiến hành tạo mới bản ghi chuyên gia độc lập
            Expert newExpert = Expert.builder()
                    .name(expertName)
                    .email(expertEmail)
                    .phone(expertPhone)
                    .passportNo(expertPassport)
                    .build();
            expert = expertRepository.save(newExpert);
        }

        String year = String.valueOf(expectedDate.getYear());
        long count = profileRepository.count() + 1;
        String profileId = String.format("SEM-%s-%04d", year, count);

        SeminarProfile profile = SeminarProfile.builder()
                .id(profileId)
                .seminarType(seminarType)
                .expectedDate(expectedDate)
                .city(city)
                .expert(expert)
                .expectedAttendees(expectedAttendees)
                .status("Mới tạo / Chờ xử lý")
                .documentWarning(false)
                .documentShipped(false)
                .documentReceived(false)
                .documentReady(false)
                .build();

        SeminarProfile savedProfile = profileRepository.save(profile);

        emailService.sendCoordinatorNotification(savedProfile);
        
        notificationService.broadcastNotification(
                "Yêu cầu khởi tạo mới",
                "Hồ sơ " + profileId + " đã được tạo bởi BP Đặt chỗ và đang chờ tiếp nhận.",
                "CREATE",
                "Role_Admin_Logistics",
                profileId
        );

        return savedProfile;
    }

    // F1.2 - CHỈ DÙNG KHI CẬP NHẬT/CHỈNH SỬA HỒ SƠ CŨ (Fix triệt để lỗi expert_id)
    public SeminarProfile updateProfile(String profileId, String seminarType, LocalDate expectedDate, String city,
                                         String expertName, String expertEmail, String expertPhone, String expertPassport,
                                         Integer expectedAttendees) {
        
        SeminarProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ hội thảo cần cập nhật"));

        // Cập nhật thông tin Chuyên gia liên kết trực tiếp của hồ sơ này
        Expert expert = profile.getExpert();
        if (expert == null) {
            expert = new Expert();
        }
        expert.setName(expertName);
        expert.setEmail(expertEmail);
        expert.setPhone(expertPhone);
        expert.setPassportNo(expertPassport);
        expert = expertRepository.save(expert);

        // Cập nhật các thông số đặc thù của cuộc hội thảo (Ngày tổ chức, thành phố, kiểu hội thảo)
        profile.setSeminarType(seminarType);
        profile.setExpectedDate(expectedDate);
        profile.setCity(city);
        profile.setExpert(expert);
        profile.setExpectedAttendees(expectedAttendees);

        SeminarProfile saved = profileRepository.save(profile);

        notificationService.broadcastNotification(
                "Cập nhật thông tin hồ sơ",
                "Hồ sơ " + profileId + " đã được bộ phận đặt chỗ điều chỉnh lại thông tin.",
                "ALERT",
                "Role_Admin_Logistics",
                profileId
        );

        return saved;
    }

    // F2.1 - Send Auto invitation
    public SeminarProfile sendExpertInvitation(String profileId) {
        SeminarProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        if ("Đã hủy".equals(profile.getStatus())) {
            throw new IllegalStateException("Không thể gửi lời mời chuyên gia cho hồ sơ đã hủy.");
        }

        profile.setExpertToken(UUID.randomUUID().toString());
        profile.setExpertTokenExpiry(LocalDateTime.now().plusDays(7));
        SeminarProfile saved = profileRepository.save(profile);

        emailService.sendExpertInvitation(saved);

        notificationService.broadcastNotification(
                "Đã gửi lời mời chuyên gia",
                "Đường link token mời tham gia đã gửi tới email chuyên gia: " + profile.getExpert().getEmail(),
                "ALERT",
                "Role_Admin_Logistics",
                profileId
        );

        return saved;
    }

    // F2.2 - Expert click agree
    public SeminarProfile acceptInvitation(String token, String desiredSchedule) {
        return acceptInvitation(token, desiredSchedule, null);
    }

    // F2.2 - Expert click agree with confirmed availability date
    public SeminarProfile acceptInvitation(String token, String desiredSchedule, LocalDate confirmedDate) {
        SeminarProfile profile = profileRepository.findByExpertToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token không hợp lệ hoặc đã hết hạn"));

        if ("Đã hủy".equals(profile.getStatus())) {
            throw new IllegalStateException("Hồ sơ đã hủy, chuyên gia không thể xác nhận tham gia.");
        }

        if (profile.getExpertTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Token đã quá hạn sử dụng");
        }

        profile.setDesiredSchedule(desiredSchedule);
        if (confirmedDate != null) {
            profile.setExpectedDate(confirmedDate);
        }
        profile.setStatus("Đang xử lý hậu cần");
        SeminarProfile saved = profileRepository.save(profile);

        notificationService.broadcastNotification(
                "Chuyên gia ĐỒNG Ý",
                "Chuyên gia hội thảo " + profile.getId() + " đã đồng ý tham gia. Ngày chốt: " + (confirmedDate != null ? confirmedDate.toString() : profile.getExpectedDate().toString()) + ". Lịch trình: " + desiredSchedule,
                "SUCCESS",
                "Role_Admin_Logistics",
                profile.getId()
        );

        return saved;
    }

    // F2.2 - Expert click reject
    public SeminarProfile rejectInvitation(String token, String reason) {
        SeminarProfile profile = profileRepository.findByExpertToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token không hợp lệ hoặc đã hết hạn"));

        if ("Đã hủy".equals(profile.getStatus())) {
            throw new IllegalStateException("Hồ sơ đã hủy, chuyên gia không thể phản hồi lời mời.");
        }

        profile.setExpertNotes(reason);
        profile.setStatus("Bị từ chối / Tạm dừng");
        SeminarProfile saved = profileRepository.save(profile);

        notificationService.broadcastNotification(
                "Chuyên gia TỪ CHỐI",
                "Chuyên gia của hội thảo " + profile.getId() + " từ chối vì lý do: " + reason,
                "REJECT",
                "Role_Reservation",
                profile.getId()
        );

        return saved;
    }

    // F3.1 - Dynamic Resource Estimation
    public Map<String, String> getResourceEstimation(String profileId) {
        SeminarProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        int attendees = profile.getExpectedAttendees();
        String type = profile.getSeminarType().toLowerCase();

        double multiplier = 2.0;
        String setupStyle = "Classroom";
        String avEquipment = "1 Máy chiếu & Màn chiếu cỡ lớn, 1 Hệ thống âm thanh cơ bản, 2 Micro không dây, 1 Bảng vẽ Flipchart.";

        if (type.contains("chuyên sâu") || type.contains("workshop") || type.contains("thực hành")) {
            multiplier = 2.5;
            setupStyle = "U-Shape (Chữ U)";
            avEquipment = "1 Máy chiếu, 1 Tivi LCD phụ, Hệ thống âm thanh nổi, 4 Micro không dây, Bộ sạc & ổ cắm cáhen tại bàn.";
        } else if (type.contains("hội nghị") || type.contains("conference") || type.contains("diễn đàn")) {
            multiplier = 1.5;
            setupStyle = "Theater (Nhà hát)";
            avEquipment = "1 Màn hình LED cực lớn, Hệ thống âm thanh Line Array cao cấp, 6 Micro không dây, 2 Micro cổ ngỗng để bục, Thiết bị ghi âm cuộc họp.";
        }

        double minRoomSize = attendees * multiplier;

        Map<String, String> estimate = new HashMap<>();
        estimate.put("minRoomSize", String.format("%.1f", minRoomSize));
        estimate.put("setupStyle", setupStyle);
        estimate.put("avEquipment", avEquipment);
        return estimate;
    }

    // F3.2 - Query hotel list
    public List<Venue> searchVenues(String city, Integer capacity) {
        String queryCity = city != null ? city.trim().toLowerCase() : "";
        if (queryCity.contains("hà nội") || queryCity.contains("ha noi") || queryCity.contains("hn")) {
            queryCity = "Hanoi";
        } else if (queryCity.contains("hồ chí minh") || queryCity.contains("ho chi minh") || queryCity.contains("hcm") || queryCity.contains("sài gòn") || queryCity.contains("sai gon") || queryCity.contains("sg") || queryCity.contains("saigon")) {
            queryCity = "Ho Chi Minh";
        } else if (queryCity.contains("đà nẵng") || queryCity.contains("da nang") || queryCity.contains("dn")) {
            queryCity = "Da Nang";
        } else if (queryCity.isEmpty()) {
            queryCity = "";
        }
        return venueRepository.findByCityContainingIgnoreCaseAndCapacityGreaterThanEqual(queryCity, capacity);
    }

    // F3.3 - ĐÃ SỬA CHI TIẾT: Hàm nhận toàn bộ thông số tùy chọn điền tay tự do gửi từ Form Admin điều phối
    // F3.3 - Booking Request (Hỗ trợ dữ liệu nhập tay linh hoạt từ Admin)
    public SeminarVenue requestVenueBooking(String profileId, Long venueId, String customMinRoomSize, String customSetupStyle, String customAvEquipment) {
        SeminarProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> new IllegalArgumentException("Venue not found"));

        SeminarVenue sv = SeminarVenue.builder()
                .seminarProfile(profile)
                .venue(venue)
                .status("PENDING")
                .salesToken(UUID.randomUUID().toString())
                .salesTokenExpiry(LocalDateTime.now().plusDays(5))
                .build();

        SeminarVenue savedSv = seminarVenueRepository.save(sv);

        // Lấy phương án dự toán tự động làm phương án dự phòng (fallback)
        Map<String, String> estimate = getResourceEstimation(profileId);
        
        // KIỂM TRA ĐIỀU KIỆN: Nếu có điền tay thì lấy điền tay, ngược lại lấy tự động
        String finalMinRoomSize = (customMinRoomSize != null && !customMinRoomSize.isBlank()) ? customMinRoomSize.trim() : estimate.get("minRoomSize");
        String finalSetupStyle = (customSetupStyle != null && !customSetupStyle.isBlank()) ? customSetupStyle.trim() : estimate.get("setupStyle");
        String finalAvEquipment = (customAvEquipment != null && !customAvEquipment.isBlank()) ? customAvEquipment.trim() : estimate.get("avEquipment");

        // Đồng bộ hóa cấu trúc HTML gửi đi trong Gmail
        String roomInfoHtml = String.format(
                "<ul>" +
                "<li><b>Kích thước phòng tối thiểu:</b> %s m2</li>" +
                "<li><b>Kiểu setup bàn ghế:</b> %s</li>" +
                "<li><b>Thiết bị nghe nhìn:</b> %s</li>" +
                "</ul>",
                finalMinRoomSize, finalSetupStyle, finalAvEquipment
        );

        // Tiến hành gửi Mail mẫu bằng dữ liệu thực tế nhập từ Form
        emailService.sendHotelBookingRequest(profile, savedSv, roomInfoHtml);

        // Khởi tạo một bản ghi ContractVersion nháp (v1) lưu trữ trực tiếp thông số điền tay này
        // Việc này giúp hàm /api/external/sales bốc ngược lại dữ liệu để hiển thị lên bảng Cổng Sales
        ContractVersion baseContract = ContractVersion.builder()
                .seminarProfile(profile)
                .version(1)
                .fileName("Yeu_Cau_Ky_Thuat_Goc.txt")
                .fileContent(finalAvEquipment.getBytes(java.nio.charset.StandardCharsets.UTF_8)) // Lưu trữ chuỗi thiết bị nghe nhìn vào blob
                .notes("Diện tích: " + finalMinRoomSize + "m2 | Setup: " + finalSetupStyle) // Lưu diện tích & sơ đồ vào notes
                .uploadedBy("ADMIN")
                .status("DRAFT")
                .createdAt(LocalDateTime.now())
                .build();
        contractVersionRepository.save(baseContract);

        notificationService.broadcastNotification(
                "Đã gửi yêu cầu đặt phòng",
                "Đã gửi email yêu cầu đặt phòng kèm thông số kỹ thuật tùy chỉnh tới khách sạn " + venue.getName(),
                "ALERT",
                "Role_Admin_Logistics",
                profileId
        );

        return savedSv;
    }

    public SeminarVenue handleSalesResponse(String token, boolean agree, String reason, byte[] contractDraft, String fileName) {
        SeminarVenue sv = seminarVenueRepository.findBySalesToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token không hợp lệ"));

        if (!agree) {
            sv.setStatus("REJECTED");
            seminarVenueRepository.save(sv);
            notificationService.broadcastNotification("Khách sạn TỪ CHỐI", "Khách sạn " + sv.getVenue().getName() + " từ chối vì: " + reason, "REJECT");
        } else {
            sv.setStatus("CONTRACT_NEGOTIATION");
            seminarVenueRepository.save(sv);
            
            // Tìm phiên bản cao nhất hiện tại để nâng cấp phiên bản đàm phán hợp đồng điện tử
            Optional<ContractVersion> latestOpt = contractVersionRepository.findFirstBySeminarProfileIdOrderByVersionDesc(sv.getSeminarProfile().getId());
            int nextVersion = latestOpt.map(c -> c.getVersion() + 1).orElse(1);

            ContractVersion cv = ContractVersion.builder()
                    .seminarProfile(sv.getSeminarProfile())
                    .version(nextVersion)
                    .fileName(fileName)
                    .fileContent(contractDraft)
                    .notes("Bản thảo hợp đồng đàm phán gửi từ Khách sạn")
                    .uploadedBy("SALES")
                    .status("DRAFT")
                    .createdAt(LocalDateTime.now())
                    .build();
            contractVersionRepository.save(cv);
            
            notificationService.broadcastNotification("Khách sạn ĐỒNG Ý", "Khách sạn đã phản hồi chấp thuận và gửi tài liệu dự thảo cho hồ sơ " + sv.getSeminarProfile().getId(), "SUCCESS");
        }
        return sv;
    }

    // F3.4 - Contract upload revision
    public ContractVersion submitContractRevision(String profileId, byte[] fileData, String fileName, String notes, String uploadedBy) {
        SeminarProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        Optional<ContractVersion> latestOpt = contractVersionRepository.findFirstBySeminarProfileIdOrderByVersionDesc(profileId);
        int nextVersion = latestOpt.map(cv -> cv.getVersion() + 1).orElse(1);

        ContractVersion cv = ContractVersion.builder()
                .seminarProfile(profile)
                .version(nextVersion)
                .fileName(fileName)
                .fileContent(fileData)
                .notes(notes)
                .uploadedBy(uploadedBy)
                .status("DRAFT")
                .createdAt(LocalDateTime.now())
                .build();

        ContractVersion saved = contractVersionRepository.save(cv);

        notificationService.broadcastNotification(
                "Đã tải lên bản hợp đồng sửa đổi",
                String.format("Bản hợp đồng sửa đổi v%d đã được tải lên bởi %s. Ghi chú: %s", nextVersion, uploadedBy, notes),
                "ALERT",
                "Role_Admin_Logistics",
                profileId
        );

        return saved;
    }

    // F3.5 - Approve Contract
    public SeminarProfile approveContract(String profileId) {
        SeminarProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        ContractVersion latestCv = contractVersionRepository.findFirstBySeminarProfileIdOrderByVersionDesc(profileId)
                .orElseThrow(() -> new IllegalStateException("Chưa có hợp đồng nào được đàm phán"));

        latestCv.setStatus("APPROVED");
        contractVersionRepository.save(latestCv);

        List<SeminarVenue> venues = seminarVenueRepository.findBySeminarProfileId(profileId);
        for (SeminarVenue sv : venues) {
            if (sv.getStatus().equals("CONTRACT_NEGOTIATION") || sv.getStatus().equals("PENDING")) {
                sv.setStatus("SELECTED");
                seminarVenueRepository.save(sv);
                
                String hotelSalesEmail = sv.getVenue().getName().toLowerCase().replace(" ", "") + "-sales@hotel.com";
                emailService.sendContractFinalized(profile, hotelSalesEmail, latestCv.getFileName(), latestCv.getFileContent());
            } else {
                sv.setStatus("REJECTED");
                sv.setSalesToken(null);
                seminarVenueRepository.save(sv);
            }
        }

        profile.setStatus("Đã chốt địa điểm");
        SeminarProfile saved = profileRepository.save(profile);

        notificationService.broadcastNotification(
                "Hợp đồng ĐÃ PHÊ DUYỆT",
                "Hợp đồng hội thảo " + profileId + " đã được Admin phê duyệt chính thức. Đã chốt địa điểm.",
                "SUCCESS",
                "Role_Admin_Logistics",
                profileId
        );

        return saved;
    }

    // F4.1 - Admin creates travel flight options
    public List<TravelOption> proposeTravelOptions(String profileId, List<Map<String, String>> flights) {
        SeminarProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        List<TravelOption> oldOpts = travelOptionRepository.findBySeminarProfileId(profileId);
        travelOptionRepository.deleteAll(oldOpts);

        String dateInfo = extractDateFromSchedule(profile.getDesiredSchedule());

        List<TravelOption> savedOptions = new ArrayList<>();
        for (Map<String, String> flight : flights) {
            String details = flight.get("flightDetails");
            if (dateInfo != null && !dateInfo.isEmpty()) {
                if (!details.contains("Ngày bay:") && !details.contains("Bay ngày")) {
                    details = "Ngày bay: " + dateInfo + " | " + details;
                }
            }
            TravelOption option = TravelOption.builder()
                    .seminarProfile(profile)
                    .flightDetails(details)
                    .estimatedCost(new BigDecimal(flight.get("estimatedCost")))
                    .status("PENDING")
                    .build();
            savedOptions.add(travelOptionRepository.save(option));
        }

        if (profile.getExpertToken() == null) {
            profile.setExpertToken(UUID.randomUUID().toString());
            profile.setExpertTokenExpiry(LocalDateTime.now().plusDays(7));
            profileRepository.save(profile);
        }

        notificationService.broadcastNotification(
                "Đã đề xuất phương án vé máy bay",
                "Đã tạo " + flights.size() + " phương án di chuyển gửi chuyên gia lựa chọn.",
                "ALERT",
                "Role_Admin_Logistics",
                profileId
        );

        return savedOptions;
    }

    // F4.2 - Expert chooses one flight option
    public TravelOption chooseTravelOption(String token, Long optionId) {
        SeminarProfile profile = profileRepository.findByExpertToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token không hợp lệ"));

        List<TravelOption> options = travelOptionRepository.findBySeminarProfileId(profile.getId());
        TravelOption chosenOption = null;

        for (TravelOption opt : options) {
            if (opt.getId().equals(optionId)) {
                opt.setStatus("SELECTED");
                chosenOption = opt;
            } else {
                opt.setStatus("REJECTED");
            }
            travelOptionRepository.save(opt);
        }

        if (chosenOption == null) {
            throw new IllegalArgumentException("Option ID not found");
        }

        byte[] pdfData = pdfExportService.generateTravelBookingRequest(profile, chosenOption);
        String fileName = "Yeu_cau_xuat_ve_Chuyen_gia_" + profile.getId() + ".pdf";

        emailService.sendTravelAgencyRequest(profile, chosenOption, pdfData, fileName);

        notificationService.broadcastNotification(
                "Chuyên gia đã chốt vé máy bay",
                "Chuyên gia chọn phương án: " + chosenOption.getFlightDetails() + ". Phiếu đặt vé máy bay đã gửi tự động đến Công ty Du lịch.",
                "SUCCESS",
                "Role_Admin_Logistics",
                profile.getId()
        );

        return chosenOption;
    }

    public String extractDateFromSchedule(String schedule) {
        if (schedule == null || schedule.trim().isEmpty()) return "";
        try {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                "(\\d{1,2}[./-]\\d{1,2}([./-]\\d{2,4})?|\\d{1,2}\\s+tháng\\s+\\d{1,2})"
            );
            java.util.regex.Matcher matcher = pattern.matcher(schedule.toLowerCase());
            if (matcher.find()) {
                return matcher.group(1);
            }
        } catch (Exception e) {
            // Ignore
        }
        return "";
    }

    // F4.3 - Update Flight code
    public SeminarProfile updateTicketCode(String profileId, String ticketCode) {
        SeminarProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        String dateInfo = extractDateFromSchedule(profile.getDesiredSchedule());
        String finalTicketCode = ticketCode;
        if (!dateInfo.isEmpty() && !ticketCode.contains("Bay ngày")) {
            finalTicketCode = ticketCode + " (Bay ngày " + dateInfo + ")";
        }

        profile.setTicketCode(finalTicketCode);
        SeminarProfile saved = profileRepository.save(profile);

        emailService.sendItineraryToExpert(saved);

        notificationService.broadcastNotification(
                "Cập nhật vé máy bay thành công",
                "Đã lưu mã vé máy bay [" + finalTicketCode + "] và gửi thông tin lịch trình chính thức cho Chuyên gia.",
                "SUCCESS",
                "Role_Admin_Logistics",
                profileId
        );

        return saved;
    }

    // F4.2 & F4.3 - Sync & simulated book flight via API (Admin Logistics only)
    public SeminarProfile bookFlightViaApi(String profileId) {
        SeminarProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ"));

        List<TravelOption> travelOpts = travelOptionRepository.findBySeminarProfileId(profileId);
        TravelOption selectedOpt = travelOpts.stream()
                .filter(opt -> "SELECTED".equals(opt.getStatus()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Chuyên gia chưa lựa chọn phương án chuyến bay nào để đồng bộ!"));

        System.out.println("[MOCK FLIGHT API] Connecting to flight reservation gateway...");
        System.out.println("[MOCK FLIGHT API] Request payload details: { \"expertName\": \"Hex" + profile.getExpert().getName() + 
                           "\", \"passportNo\": \"" + profile.getExpert().getPassportNo() + 
                           "\", \"flightDetails\": \"" + selectedOpt.getFlightDetails() + 
                           "\", \"estimatedCost\": " + selectedOpt.getEstimatedCost() + " }");
        System.out.println("[MOCK FLIGHT API] Simulated outbound HTTP response: 200 OK. Booking confirmed.");

        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder("PNR-");
        Random rand = new Random();
        for (int i = 0; i < 6; i++) {
            sb.append(characters.charAt(rand.nextInt(characters.length())));
        }
        String generatedCode = sb.toString();

        String dateInfo = extractDateFromSchedule(profile.getDesiredSchedule());
        if (!dateInfo.isEmpty()) {
            generatedCode = generatedCode + " (Bay ngày " + dateInfo + ")";
        }

        profile.setTicketCode(generatedCode);
        SeminarProfile saved = profileRepository.save(profile);

        emailService.sendItineraryToExpert(saved);

        notificationService.broadcastNotification(
                "Đồng bộ & Đặt vé API thành công",
                "Đã tự động gọi API đặt vé máy bay thành công. Mã vé xuất: [" + generatedCode + "] đã gửi tự động tới email Chuyên gia.",
                "SUCCESS",
                "Role_Admin_Logistics",
                profileId
                );

        return saved;
    }

    // F5.1 - 14-day countdown check
    public List<SeminarProfile> check14DaysCountdown() {
        List<SeminarProfile> profiles = profileRepository.findAll();
        List<SeminarProfile> triggered = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (SeminarProfile p : profiles) {
            if (p.getStatus().equals("Đã chốt địa điểm") && p.getExpectedDate().minusDays(14).isEqual(today)) {
                p.setDocumentWarning(true);
                profileRepository.save(p);
                triggered.add(p);

                notificationService.broadcastNotification(
                        "CẢNH BÁO: Còn 14 ngày trước hội thảo",
                        "Hồ sơ " + p.getId() + " chỉ còn đúng 14 ngày trước ngày tổ chức! Vui lòng chuẩn bị tài liệu gấp.",
                        "ALERT",
                        "Role_Admin_Logistics",
                        p.getId()
                );
            }
        }
        return triggered;
    }

    // F5.2 & F5.3 - Calculate materials and export shipping slip PDF
    public Map<String, Object> finalizeDocuments(String profileId, Integer actualAttendees) {
        SeminarProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        profile.setActualAttendees(actualAttendees);
        profileRepository.save(profile);

        int books = actualAttendees;
        int brochures = actualAttendees * 2;
        int nametags = actualAttendees;

        List<SeminarVenue> venues = seminarVenueRepository.findBySeminarProfileId(profileId);
        String hotelAddress = "Khách sạn đối tác tại thành phố " + profile.getCity();
        String hotelSalesEmail = "hotel-sales@hotel.com";
        for (SeminarVenue sv : venues) {
            if (sv.getStatus().equals("SELECTED")) {
                hotelAddress = sv.getVenue().getName() + ", Thành phố " + sv.getVenue().getCity();
                hotelSalesEmail = sv.getVenue().getName().toLowerCase().replace(" ", "") + "-sales@hotel.com";
                break;
            }
        }

        byte[] pdfData = pdfExportService.generatePackingAndShippingSlip(profile, books, brochures, nametags, hotelAddress);
        String fileName = "Phieu_van_chuyen_tai_lieu_" + profileId + ".pdf";

        emailService.sendPackingSlipToDocumentProcessor(profile, pdfData, fileName);
        emailService.sendDocumentShippingAlertToSales(profile, hotelSalesEmail);

        profile.setDocumentShipped(true);
        profileRepository.save(profile);

        notificationService.broadcastNotification(
                "Đã kết xuất Phiếu vận chuyển tài liệu",
                "Đã tính định mức xuất bản phẩm (Sách: " + books + ", Tờ rơi: " + brochures + ", Thẻ tên: " + nametags + ") và gửi file PDF tự động tới BP Xử lý tài liệu.",
                "SUCCESS",
                "Role_Doc_Processor",
                profileId
        );

        Map<String, Object> result = new HashMap<>();
        result.put("books", books);
        result.put("brochures", brochures);
        result.put("nametags", nametags);
        result.put("fileName", fileName);
        result.put("pdfData", Base64.getEncoder().encodeToString(pdfData));
        return result;
    }

    public SeminarProfile markDocumentReady(String profileId) {
        SeminarProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ"));

        profile.setDocumentReady(true);
        profile.setStatus("Đang gửi tài liệu");
        SeminarProfile saved = profileRepository.save(profile);

        notificationService.broadcastNotification(
                "Tài liệu đã chuẩn bị xong",
                "Bộ phận Xử lý tài liệu xác nhận đã đóng gói và chuẩn bị xong toàn bộ ấn phẩm cho hồ sơ " + profileId + ".",
                "SUCCESS",
                "Role_Admin_Logistics",
                profileId
            );

        return saved;
    }

    public SeminarProfile confirmDeliveryBySales(String token) {
        SeminarVenue sv = seminarVenueRepository.findBySalesToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Sales token không hợp lệ"));

        SeminarProfile profile = sv.getSeminarProfile();
        profile.setDocumentReceived(true);
        SeminarProfile saved = profileRepository.save(profile);

        notificationService.broadcastNotification(
                "Khách sạn đã nhận tài liệu",
                "Khách sạn " + sv.getVenue().getName() + " xác nhận đã nhận bàn giao đủ ấn phẩm tài liệu cho hồ sơ " + profile.getId() + ".",
                "SUCCESS",
                "Role_Admin_Logistics",
                profile.getId()
        );

        return saved;
    }

    // F5.4 - Complete workflow
    public SeminarProfile completeLogistics(String profileId, boolean hotelConfirmed) {
        SeminarProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        if (!profile.getDocumentShipped()) {
            throw new IllegalStateException("Ấn phẩm tài liệu chưa được kết xuất và gửi đi!");
        }

        if (profile.getDocumentReady() == null || !profile.getDocumentReady()) {
            throw new IllegalStateException("Bộ phận Xử lý tài liệu chưa xác nhận hoàn tất chuẩn bị ấn phẩm!");
        }

        profile.setDocumentReceived(hotelConfirmed);

        if (hotelConfirmed) {
            profile.setStatus("Sẵn sàng tổ chức");
            profileRepository.save(profile);

            notificationService.broadcastNotification(
                    "HOÀN TẤT QUY TRÌNH HẬU CẦN",
                    "Hồ sơ " + profileId + " đã hoàn tất và sẵn sàng tổ chức thành công!",
                    "SUCCESS",
                    "Role_Admin_Logistics",
                    profileId
                );
        } else {
            notificationService.broadcastNotification(
                    "Xác nhận bàn giao tài liệu",
                    "Tài liệu đã được gửi nhưng Khách sạn chưa xác nhận đã nhận hàng.",
                    "ALERT",
                    "Role_Admin_Logistics",
                    profileId
            );
        }

        return profile;
    }
}