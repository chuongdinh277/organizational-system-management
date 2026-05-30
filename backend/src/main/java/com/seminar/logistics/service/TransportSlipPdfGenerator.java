package com.seminar.logistics.service;

import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.zip.DeflaterOutputStream;
import com.seminar.logistics.model.MaterialShipment;
import org.springframework.stereotype.Component;

@Component
public class TransportSlipPdfGenerator {
  private static final int PAGE_WIDTH = 595;
  private static final int PAGE_HEIGHT = 842;
  private static final int RENDER_SCALE = 2;

  /** Tạo dữ liệu PDF cho phiếu đóng gói và vận chuyển ấn phẩm. */
  public byte[] createTransportSlipPdf(MaterialShipment materialShipment) {
    List<String> pdfLines = new ArrayList<>();
    pdfLines.add("PHIẾU YÊU CẦU ĐÓNG GÓI VÀ VẬN CHUYỂN");
    pdfLines.add("Mã hồ sơ: " + materialShipment.getWorkflowId());
    pdfLines.add("Loại hội thảo: " + materialShipment.getSeminarType());
    pdfLines.add("Ngày tổ chức: " + materialShipment.getSeminarDate());
    pdfLines.add("Thành phố: " + materialShipment.getSeminarCity());
    pdfLines.add("Địa điểm: " + materialShipment.getVenueName());
    pdfLines.add("Địa chỉ giao hàng: " + materialShipment.getVenueAddress());
    pdfLines.add("Ngày tạo phiếu: " + LocalDate.now());
    pdfLines.add("Danh sách ấn phẩm:");

    for (Map.Entry<String, Integer> materialQuantity : materialShipment.getMaterialQuantities().entrySet()) {
      pdfLines.add("- " + materialQuantity.getKey() + ": " + materialQuantity.getValue());
    }

    pdfLines.add("Ghi chú: Bộ phận tài liệu đóng gói đúng số lượng và báo cáo mã vận đơn sau khi gửi.");
    return buildImagePdf(pdfLines);
  }

  /** Tạo PDF một trang bằng ảnh để hiển thị đúng tiếng Việt có dấu. */
  private byte[] buildImagePdf(List<String> pdfLines) {
    BufferedImage slipImage = renderSlipImage(pdfLines);
    byte[] imageStream = compressRgbImage(slipImage);
    byte[] contentStream = "q\n595 0 0 842 0 0 cm\n/Im1 Do\nQ\n".getBytes(StandardCharsets.US_ASCII);

    List<byte[]> pdfObjects = List.of(
        ascii("<< /Type /Catalog /Pages 2 0 R >>"),
        ascii("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
        ascii("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
            + "/Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>"),
        streamObject("<< /Type /XObject /Subtype /Image /Width " + slipImage.getWidth()
            + " /Height " + slipImage.getHeight()
            + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length "
            + imageStream.length + " >>", imageStream),
        streamObject("<< /Length " + contentStream.length + " >>", contentStream));

    return assemblePdf(pdfObjects);
  }

  /** Vẽ nội dung phiếu thành ảnh để nhúng vào PDF. */
  private BufferedImage renderSlipImage(List<String> pdfLines) {
    int imageWidth = PAGE_WIDTH * RENDER_SCALE;
    int imageHeight = PAGE_HEIGHT * RENDER_SCALE;
    BufferedImage image = new BufferedImage(imageWidth, imageHeight, BufferedImage.TYPE_INT_RGB);
    Graphics2D graphics = image.createGraphics();
    try {
      graphics.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
      graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
      graphics.setColor(Color.WHITE);
      graphics.fillRect(0, 0, imageWidth, imageHeight);

      Font titleFont = new Font(Font.SANS_SERIF, Font.BOLD, 22 * RENDER_SCALE);
      Font normalFont = new Font(Font.SANS_SERIF, Font.PLAIN, 12 * RENDER_SCALE);
      Font boldFont = new Font(Font.SANS_SERIF, Font.BOLD, 13 * RENDER_SCALE);
      int margin = 50 * RENDER_SCALE;
      int maxLineWidth = imageWidth - (margin * 2);
      int lineHeight = 22 * RENDER_SCALE;
      int y = 70 * RENDER_SCALE;

      graphics.setColor(new Color(20, 34, 48));
      graphics.setFont(titleFont);
      FontMetrics titleMetrics = graphics.getFontMetrics();
      String title = pdfLines.getFirst();
      int titleX = (imageWidth - titleMetrics.stringWidth(title)) / 2;
      graphics.drawString(title, titleX, y);

      y += 18 * RENDER_SCALE;
      graphics.setColor(new Color(180, 190, 200));
      graphics.drawLine(margin, y, imageWidth - margin, y);
      y += 34 * RENDER_SCALE;

      for (int lineIndex = 1; lineIndex < pdfLines.size(); lineIndex++) {
        String line = pdfLines.get(lineIndex);
        graphics.setFont(line.equals("Danh sách ấn phẩm:") ? boldFont : normalFont);
        graphics.setColor(new Color(31, 41, 55));
        y = drawWrappedLine(graphics, line, margin, y, maxLineWidth, lineHeight);
        if (line.equals("Danh sách ấn phẩm:")) {
          y += 6 * RENDER_SCALE;
        }
      }
    } finally {
      graphics.dispose();
    }
    return image;
  }

  /** Vẽ một dòng dài thành nhiều dòng nhỏ nếu vượt chiều rộng trang. */
  private int drawWrappedLine(Graphics2D graphics, String text, int x, int y, int maxWidth, int lineHeight) {
    FontMetrics metrics = graphics.getFontMetrics();
    StringBuilder currentLine = new StringBuilder();
    for (String word : text.split(" ")) {
      String nextLine = currentLine.isEmpty() ? word : currentLine + " " + word;
      if (metrics.stringWidth(nextLine) > maxWidth && !currentLine.isEmpty()) {
        graphics.drawString(currentLine.toString(), x, y);
        currentLine = new StringBuilder(word);
        y += lineHeight;
      } else {
        currentLine = new StringBuilder(nextLine);
      }
    }
    graphics.drawString(currentLine.toString(), x, y);
    return y + lineHeight;
  }

  /** Nén dữ liệu màu RGB của ảnh để đưa vào đối tượng PDF. */
  private byte[] compressRgbImage(BufferedImage image) {
    ByteArrayOutputStream rawRgb = new ByteArrayOutputStream(image.getWidth() * image.getHeight() * 3);
    for (int y = 0; y < image.getHeight(); y++) {
      for (int x = 0; x < image.getWidth(); x++) {
        int rgb = image.getRGB(x, y);
        rawRgb.write((rgb >> 16) & 0xff);
        rawRgb.write((rgb >> 8) & 0xff);
        rawRgb.write(rgb & 0xff);
      }
    }

    ByteArrayOutputStream compressed = new ByteArrayOutputStream();
    try (DeflaterOutputStream deflater = new DeflaterOutputStream(compressed)) {
      deflater.write(rawRgb.toByteArray());
    } catch (java.io.IOException exception) {
      throw new IllegalStateException("Không thể nén ảnh phiếu vận chuyển.", exception);
    }
    return compressed.toByteArray();
  }

  /** Gói nội dung nhị phân thành một stream object của PDF. */
  private byte[] streamObject(String dictionary, byte[] streamContent) {
    ByteArrayOutputStream object = new ByteArrayOutputStream();
    writeAscii(object, dictionary + "\nstream\n");
    object.writeBytes(streamContent);
    writeAscii(object, "\nendstream");
    return object.toByteArray();
  }

  /** Ghép các object thành một file PDF hoàn chỉnh. */
  private byte[] assemblePdf(List<byte[]> pdfObjects) {
    ByteArrayOutputStream pdfDocument = new ByteArrayOutputStream();
    List<Integer> objectOffsets = new ArrayList<>();
    writeAscii(pdfDocument, "%PDF-1.4\n");

    for (int objectIndex = 0; objectIndex < pdfObjects.size(); objectIndex++) {
      objectOffsets.add(pdfDocument.size());
      writeAscii(pdfDocument, (objectIndex + 1) + " 0 obj\n");
      pdfDocument.writeBytes(pdfObjects.get(objectIndex));
      writeAscii(pdfDocument, "\nendobj\n");
    }

    int crossReferenceOffset = pdfDocument.size();
    writeAscii(pdfDocument, "xref\n");
    writeAscii(pdfDocument, "0 " + (pdfObjects.size() + 1) + "\n");
    writeAscii(pdfDocument, "0000000000 65535 f \n");
    for (Integer objectOffset : objectOffsets) {
      writeAscii(pdfDocument, String.format("%010d 00000 n \n", objectOffset));
    }
    writeAscii(pdfDocument, "trailer\n");
    writeAscii(pdfDocument, "<< /Size " + (pdfObjects.size() + 1) + " /Root 1 0 R >>\n");
    writeAscii(pdfDocument, "startxref\n");
    writeAscii(pdfDocument, crossReferenceOffset + "\n");
    writeAscii(pdfDocument, "%%EOF");
    return pdfDocument.toByteArray();
  }

  private byte[] ascii(String value) {
    return value.getBytes(StandardCharsets.US_ASCII);
  }

  private void writeAscii(ByteArrayOutputStream outputStream, String value) {
    outputStream.writeBytes(value.getBytes(StandardCharsets.US_ASCII));
  }
}
