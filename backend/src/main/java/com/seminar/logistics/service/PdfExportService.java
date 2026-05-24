package com.seminar.logistics.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.seminar.logistics.model.Expert;
import com.seminar.logistics.model.SeminarProfile;
import com.seminar.logistics.model.SeminarVenue;
import com.seminar.logistics.model.TravelOption;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class PdfExportService {

    private static final Font TITLE_FONT = new Font(Font.HELVETICA, 18, Font.BOLD);
    private static final Font SUBTITLE_FONT = new Font(Font.HELVETICA, 12, Font.ITALIC);
    private static final Font BOLD_FONT = new Font(Font.HELVETICA, 10, Font.BOLD);
    private static final Font REGULAR_FONT = new Font(Font.HELVETICA, 10, Font.NORMAL);

    private void addTableHeader(PdfPTable table, String headerTitle) {
        PdfPCell cell = new PdfPCell(new Phrase(headerTitle, BOLD_FONT));
        cell.setBackgroundColor(java.awt.Color.LIGHT_GRAY);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(6);
        table.addCell(cell);
    }

    private void addTableRow(PdfPTable table, String key, String value) {
        PdfPCell cellKey = new PdfPCell(new Phrase(key, BOLD_FONT));
        cellKey.setPadding(5);
        PdfPCell cellValue = new PdfPCell(new Phrase(value, REGULAR_FONT));
        cellValue.setPadding(5);
        table.addCell(cellKey);
        table.addCell(cellValue);
    }

    public byte[] generateRoomBookingRequest(SeminarProfile profile, SeminarVenue sv, String minRoomSize, String setupStyle, String avEquipment) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Paragraph title = new Paragraph("PHIẾU YÊU CẦU ĐẶT PHÒNG HỘI NGHỊ", TITLE_FONT);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(10);
            document.add(title);

            Paragraph dateSub = new Paragraph("Ngày tạo phiếu: " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), SUBTITLE_FONT);
            dateSub.setAlignment(Element.ALIGN_CENTER);
            dateSub.setSpacingAfter(20);
            document.add(dateSub);

            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{30f, 70f});

            addTableHeader(table, "HẠNG MỤC");
            addTableHeader(table, "CHI TIẾT YÊU CẦU");

            addTableRow(table, "Mã Hồ Sơ", profile.getId());
            addTableRow(table, "Loại Hội Thảo", profile.getSeminarType());
            addTableRow(table, "Địa Điểm Khách Sạn", sv.getVenue().getName());
            addTableRow(table, "Thành Phố", sv.getVenue().getCity());
            addTableRow(table, "Ngày Tổ Chức Dự Kiến", profile.getExpectedDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            addTableRow(table, "Số Lượng Đại Biểu Dự Kiến", profile.getExpectedAttendees() + " người");
            addTableRow(table, "Kích Thước Phòng Tối Thiểu", minRoomSize + " m2");
            addTableRow(table, "Kiểu Setup Bàn Ghế", setupStyle);
            addTableRow(table, "Danh Mục Thiết Bị Âm Thanh & Ánh Sáng", avEquipment);
            addTableRow(table, "Kinh Phí Ước Tính Hệ Thống", sv.getVenue().getEstimatedCost().toString() + " VND");

            document.add(table);

            Paragraph footer = new Paragraph("\n\n\n\nĐại diện Ban Điều Phối\n(Ký và ghi rõ họ tên)", BOLD_FONT);
            footer.setAlignment(Element.ALIGN_RIGHT);
            document.add(footer);

            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return out.toByteArray();
    }

    public byte[] generateTravelBookingRequest(SeminarProfile profile, TravelOption option) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Paragraph title = new Paragraph("PHIẾU YÊU CẦU ĐẶT VÉ MÁY BAY & ĐƯA ĐÓN", TITLE_FONT);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(10);
            document.add(title);

            Paragraph dateSub = new Paragraph("Ngày gửi: " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), SUBTITLE_FONT);
            dateSub.setAlignment(Element.ALIGN_CENTER);
            dateSub.setSpacingAfter(20);
            document.add(dateSub);

            Expert expert = profile.getExpert();

            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{35f, 65f});

            addTableHeader(table, "THÔNG TIN CẦN THIẾT");
            addTableHeader(table, "NỘI DUNG CHI TIẾT");

            addTableRow(table, "Mã Hồ Sơ Hội Thảo", profile.getId());
            addTableRow(table, "Họ Tên Chuyên Gia", expert.getName());
            addTableRow(table, "Số CCCD / Passport (Giải mã an toàn)", expert.getPassportNo());
            addTableRow(table, "Số Điện Thoại Liên Hệ", expert.getPhone());
            addTableRow(table, "Email Chuyên Gia", expert.getEmail());
            addTableRow(table, "Phương Án Di Chuyển Lựa Chọn", option.getFlightDetails());
            addTableRow(table, "Ngày Hội Thảo Tổ Chức", profile.getExpectedDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            addTableRow(table, "Địa Điểm Tổ Chức", profile.getCity());

            document.add(table);

            Paragraph notes = new Paragraph("\n* Lưu ý công ty du lịch đối tác: Vui lòng xác nhận và xuất vé điện tử, sau đó gửi lại Mã vé (Code vé máy bay) cho Điều phối viên.", SUBTITLE_FONT);
            document.add(notes);

            Paragraph footer = new Paragraph("\n\n\n\nNgười Duyệt Yêu Cầu\n(Ký tên đóng dấu)", BOLD_FONT);
            footer.setAlignment(Element.ALIGN_RIGHT);
            document.add(footer);

            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return out.toByteArray();
    }

    public byte[] generatePackingAndShippingSlip(SeminarProfile profile, int books, int brochures, int nametags, String hotelAddress) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Paragraph title = new Paragraph("PHIẾU YÊU CẦU ĐÓNG GÓI & VẬN CHUYỂN ẤN PHẨM", TITLE_FONT);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(10);
            document.add(title);

            Paragraph dateSub = new Paragraph("Lệnh xuất kho ngày: " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), SUBTITLE_FONT);
            dateSub.setAlignment(Element.ALIGN_CENTER);
            dateSub.setSpacingAfter(20);
            document.add(dateSub);

            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{35f, 65f});

            addTableHeader(table, "HẠNG MỤC PHÁT HÀNH");
            addTableHeader(table, "SỐ LƯỢNG / THÔNG TIN");

            addTableRow(table, "Mã Hồ Sơ", profile.getId());
            addTableRow(table, "Tên Hội Thảo", profile.getSeminarType());
            addTableRow(table, "Số Lượng Khách Chốt Cuối", profile.getActualAttendees() + " người");
            addTableRow(table, "Số Sách Tài Liệu (1 bộ/người)", books + " cuốn");
            addTableRow(table, "Số Tờ Rơi / Brochure (2 bộ/người)", brochures + " tờ");
            addTableRow(table, "Số Thẻ Tên Đại Biểu (1 bộ/người)", nametags + " cái");
            addTableRow(table, "Địa Điểm Nhận Hàng (Khách sạn)", hotelAddress);
            addTableRow(table, "Hạn Bàn Giao Tại Khách Sạn", profile.getExpectedDate().minusDays(1).format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + " (1 ngày trước sự kiện)");

            document.add(table);

            Paragraph warning = new Paragraph("\n* Bộ phận Xử lý Tài liệu lưu ý đóng gói chống thấm nước và chuyển phát nhanh hỏa tốc đảm bảo kịp hạn trước sự kiện.", SUBTITLE_FONT);
            document.add(warning);

            Paragraph footer = new Paragraph("\n\n\n\nQuản Lý Kho Tài Liệu\n(Ký và đóng dấu xuất kho)", BOLD_FONT);
            footer.setAlignment(Element.ALIGN_RIGHT);
            document.add(footer);

            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return out.toByteArray();
    }
}
