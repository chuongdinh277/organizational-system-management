package com.seminar.logistics.service;

import com.seminar.logistics.model.Expert;
import com.seminar.logistics.model.SeminarProfile;
import com.seminar.logistics.model.SeminarVenue;
import com.seminar.logistics.model.TravelOption;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.util.ByteArrayDataSource;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    // Đã chuyển fallback default về lại 5173
    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Async
    public void sendEmail(String to, String subject, String htmlContent) {
        sendEmailWithAttachment(to, subject, htmlContent, null, null);
    }

    @Async
    public void sendEmailWithAttachment(String to, String subject, String htmlContent, byte[] attachment, String fileName) {
        if (mailSender == null) {
            System.out.println("Mail sender is not initialized. HTML email content would be:\n" + htmlContent);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            helper.setFrom("dinhvanquocchuong277@gmail.com");

            if (attachment != null && fileName != null) {
                ByteArrayDataSource dataSource = new ByteArrayDataSource(attachment, "application/pdf");
                helper.addAttachment(fileName, dataSource);
            }

            mailSender.send(message);
            System.out.println("Email successfully sent to " + to + " with subject: " + subject);
        } catch (Exception e) {
            System.err.println("Error sending email to " + to + ": " + e.getMessage());
        }
    }

    public void sendExpertInvitation(SeminarProfile profile) {
        Expert expert = profile.getExpert();
        String invitationUrl = frontendUrl + "/expert-portal?token=" + profile.getExpertToken();
        String htmlContent = String.format(
                "<h2>Kính gửi Chuyên gia %s,</h2>" +
                "<p>Chúng tôi trân trọng kính mời Ông/Bà tham gia tổ chức hội thảo <b>%s</b> tại thành phố <b>%s</b> vào ngày <b>%s</b>.</p>" +
                "<p>Để xác nhận sự tham gia và gửi lịch trình mong muốn, vui lòng nhấp vào đường liên kết dưới đây:</p>" +
                "<p><a href='%s' style='display:inline-block;background-color:#1a73e8;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;'>Xác nhận tham gia</a></p>" +
                "<p>Lưu ý: Đường dẫn này có giá trị bảo mật và giới hạn thời gian.</p>" +
                "<br/><p>Trân trọng,<br/>Bộ phận Điều phối Hội thảo</p>",
                expert.getName(), profile.getSeminarType(), profile.getCity(), profile.getExpectedDate(), invitationUrl
        );
        sendEmail(expert.getEmail(), "[Lời mời] Tổ chức hội thảo " + profile.getSeminarType(), htmlContent);
    }

    public void sendCoordinatorNotification(SeminarProfile profile) {
        String htmlContent = String.format(
                "<h2>Hồ sơ yêu cầu mới tạo</h2>" +
                "<p>Hệ thống vừa tiếp nhận yêu cầu chuẩn bị hội thảo từ bộ phận Đặt chỗ:</p>" +
                "<ul>" +
                "<li><b>ID Hồ sơ:</b> %s</li>" +
                "<li><b>Loại hội thảo:</b> %s</li>" +
                "<li><b>Ngày tổ chức:</b> %s</li>" +
                "<li><b>Thành phố:</b> %s</li>" +
                "<li><b>Chuyên gia:</b> %s</li>" +
                "<li><b>Số người dự kiến:</b> %d</li>" +
                "</ul>" +
                "<p>Vui lòng đăng nhập vào Dashboard Điều phối viên để xử lý tiếp nhận.</p>",
                profile.getId(), profile.getSeminarType(), profile.getExpectedDate(), profile.getCity(),
                profile.getExpert().getName(), profile.getExpectedAttendees()
        );
        sendEmail("dinhvanquocchuong277@gmail.com", "[Cảnh báo] Khởi tạo hồ sơ " + profile.getId(), htmlContent);
    }

    public void sendHotelBookingRequest(SeminarProfile profile, SeminarVenue sv, String roomInfoHtml) {
        String salesUrl = frontendUrl + "/sales-portal?token=" + sv.getSalesToken();
        String htmlContent = String.format(
                "<h2>Kính gửi Giám đốc Kinh doanh (Sales Manager),</h2>" +
                "<p>Chúng tôi xin gửi yêu cầu đặt phòng hội nghị cho sự kiện sắp tới:</p>" +
                "<ul>" +
                "<li><b>Ngày tổ chức:</b> %s</li>" +
                "<li><b>Số lượng người dự kiến:</b> %d người</li>" +
                "</ul>" +
                "<h3>Yêu cầu kỹ thuật dự toán:</h3>" +
                "%s" +
                "<p>Để xem xét yêu cầu đặt phòng, tải về biểu mẫu và tải lên dự thảo hợp đồng kinh tế, vui lòng truy cập cổng đàm phán dưới đây:</p>" +
                "<p><a href='%s' style='display:inline-block;background-color:#0f9d58;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;'>Truy cập Cổng đàm phán Hợp đồng</a></p>" +
                "<br/><p>Trân trọng,<br/>Bộ phận Điều phối Hội thảo</p>",
                profile.getExpectedDate(), profile.getExpectedAttendees(), roomInfoHtml, salesUrl
        );
        sendEmail(sv.getVenue().getName().toLowerCase().replace(" ", "") + "-sales@hotel.com",
                "[Yêu cầu Đặt phòng] Hội thảo " + profile.getSeminarType() + " - " + profile.getExpectedDate(), htmlContent);
    }

    public void sendContractFinalized(SeminarProfile profile, String salesEmail, String fileName, byte[] contractPdf) {
        String htmlContent = String.format(
                "<h2>Kính gửi Giám đốc Kinh doanh,</h2>" +
                "<p>Hợp đồng kinh tế cho hội thảo <b>%s</b> tổ chức ngày <b>%s</b> đã được Điều phối viên phê duyệt chính thức.</p>" +
                "<p>Chúng tôi đính kèm bản hợp đồng đã ký chốt trong email này. Địa điểm tổ chức đã được khóa chính thức trên hệ thống.</p>" +
                "<br/><p>Trân trọng,<br/>Bộ phận Điều phối Hội thảo</p>",
                profile.getSeminarType(), profile.getExpectedDate()
        );
        sendEmailWithAttachment(salesEmail, "[Hợp đồng phê duyệt] " + profile.getId() + " - " + profile.getSeminarType(), htmlContent, contractPdf, fileName);
    }

    public void sendTravelAgencyRequest(SeminarProfile profile, TravelOption option, byte[] attachment, String attachmentName) {
        String htmlContent = String.format(
                "<h2>Kính gửi Công ty Du lịch đối tác,</h2>" +
                "<p>Chúng tôi xin gửi yêu cầu đặt vé máy bay và xe đưa đón cho chuyên gia theo phương án đã chốt:</p>" +
                "<ul>" +
                "<li><b>Chuyên gia:</b> %s</li>" +
                "<li><b>Thông tin di chuyển:</b> %s</li>" +
                "</ul>" +
                "<p>Chi tiết thông tin tùy thân (đã giải mã an toàn) và phiếu yêu cầu đặt vé được đính kèm trong email này.</p>" +
                "<p>Vui lòng tiến hành xuất vé và phản hồi lại mã code vé máy bay sớm nhất.</p>" +
                "<br/><p>Trân trọng,<br/>Bộ phận Điều phối Hội thảo</p>",
                profile.getExpert().getName(), option.getFlightDetails()
        );
        sendEmailWithAttachment("booking@travelagency.com", "[Yêu cầu Xuất vé] Chuyên gia " + profile.getExpert().getName(), htmlContent, attachment, attachmentName);
    }

    public void sendItineraryToExpert(SeminarProfile profile) {
        Expert expert = profile.getExpert();
        String htmlContent = String.format(
                "<h2>Kính gửi Chuyên gia %s,</h2>" +
                "<p>Chúng tôi xin xác nhận lịch trình di chuyển chi tiết của Ông/Bà cho hội thảo tại <b>%s</b> vào ngày <b>%s</b>:</p>" +
                "<ul>" +
                "<li><b>Lịch trình chốt:</b> %s</li>" +
                "<li><b>Mã vé máy bay (E-Ticket Code):</b> <span style='font-size:18px;color:#d93025;font-weight:bold;'>%s</span></li>" +
                "</ul>" +
                "<p>Xe đưa đón sẽ túc trực theo thông tin lịch trình để đón và tiễn chuyên gia chu đáo.</p>" +
                "<br/><p>Trân trọng,<br/>Bộ phận Điều phối Hội thảo</p>",
                expert.getName(), profile.getCity(), profile.getExpectedDate(), profile.getDesiredSchedule(), profile.getTicketCode()
        );
        sendEmail(expert.getEmail(), "[Lịch trình chính thức] Vé máy bay & Đưa đón hội thảo " + profile.getCity(), htmlContent);
    }

    public void sendPackingSlipToDocumentProcessor(SeminarProfile profile, byte[] pdfData, String fileName) {
        String htmlContent = String.format(
                "<h2>Kính gửi Bộ phận Xử lý Tài liệu,</h2>" +
                "<p>Hệ thống gửi yêu cầu chuẩn bị và vận chuyển ấn phẩm tài liệu cho hội thảo ngày <b>%s</b> tại khách sạn thuộc <b>%s</b>:</p>" +
                "<ul>" +
                "<li><b>Mã hội thảo:</b> %s</li>" +
                "<li><b>Số lượng thực tế:</b> %d người</li>" +
                "</ul>" +
                "<p>Chi tiết số lượng từng ấn phẩm (sách, thẻ tên, tờ rơi) và địa chỉ nhận hàng được đính kèm trong file PDF gửi kèm.</p>" +
                "<p>Vui lòng thực hiện đóng gói và vận chuyển bàn giao trước ngày sự kiện.</p>" +
                "<br/><p>Trân trọng,<br/>Bộ phận Điều phối Hội thảo</p>",
                profile.getExpectedDate(), profile.getCity(), profile.getId(), profile.getActualAttendees()
        );
        sendEmailWithAttachment("docs-processor@company.com", "[Lệnh đóng gói] Phiếu vận chuyển ấn phẩm " + profile.getId(), htmlContent, pdfData, fileName);
    }

    public void sendDocumentShippingAlertToSales(SeminarProfile profile, String salesEmail) {
        String htmlContent = String.format(
                "<h2>Kính gửi Sales Manager,</h2>" +
                "<p>Chúng tôi xin thông báo: Bộ phận hậu cần đang thực hiện chuẩn bị và chuẩn bị giao tài liệu/ấn phẩm hội thảo đến khách sạn của Quý đối tác.</p>" +
                "<ul>" +
                "<li><b>Mã hội thảo:</b> %s</li>" +
                "<li><b>Ngày tổ chức:</b> %s</li>" +
                "<li><b>Số lượng khách thực tế:</b> %d người</li>" +
                "</ul>" +
                "<p>Ấn phẩm sẽ được vận chuyển hỏa tốc đến địa chỉ khách sạn sớm nhất. Vui lòng xác nhận qua link cổng đàm phán khi nhận được hàng.</p>" +
                "<br/><p>Trân trọng,<br/>Bộ phận Điều phối Hội thảo</p>",
                profile.getId(), profile.getExpectedDate(), profile.getActualAttendees()
        );
        sendEmail(salesEmail, "[Thông báo giao hàng] Vận chuyển tài liệu hội thảo " + profile.getId(), htmlContent);
    }
}