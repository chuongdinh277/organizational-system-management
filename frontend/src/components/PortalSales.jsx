import React, { useState } from 'react';
import { CheckCircle, X, Download, AlertTriangle, Upload, Hotel, FileText } from 'lucide-react';

export default function PortalSales({ 
  portalData, 
  salesRejectReason, 
  setSalesRejectReason, 
  isSubmitting, 
  negotiationNotes, 
  setNegotiationNotes, 
  handleSalesRespond, 
  handleSalesUploadRevision, 
  handleSalesConfirmDelivery,
  ...props 
}) {
  const sv = portalData;
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [localSubmitting, setLocalSubmitting] = useState(false);
  
  if (!sv) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#050816', color: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Đang nạp cấu hình bảo mật dữ liệu đàm phán...</p>
        </div>
      </div>
    );
  }

  // Intercept form submit để bổ sung tham số token mã hóa từ dữ liệu sv hiện tại
  const onRevisionSubmitLocal = async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('contract-revision-file');
    if (!fileInput || !fileInput.files[0]) {
      alert('Vui lòng chọn tệp hợp đồng chỉnh sửa trước khi tải lên!');
      return;
    }
    if (fileInput.files[0].size === 0) {
      alert('Tệp tin tải lên bị lỗi hoặc có kích thước trống (0 bytes)!');
      return;
    }

    setLocalSubmitting(true);
    // Chuẩn bị FormData khớp chính xác cấu trúc nhận @RequestParam của ExternalController
    const formDataUpload = new FormData();
    formDataUpload.append('token', sv.salesToken || new URLSearchParams(window.location.search).get('token'));
    formDataUpload.append('file', fileInput.files[0]);
    formDataUpload.append('notes', negotiationNotes || 'Bản sửa đổi điều khoản từ phía Khách sạn.');
    formDataUpload.append('uploadedBy', 'SALES');

    try {
      const res = await fetch('/api/external/sales/contract/revision', {
        method: 'POST',
        body: formDataUpload
        // Tuyệt đối KHÔNG set header Content-Type để trình duyệt tự động định nghĩa Boundary
      });

      if (res.ok) {
        alert('Đã gửi bản hợp đồng sửa đổi (Revision) thành công đến Ban điều phối!');
        setNegotiationNotes('');
        fileInput.value = '';
        if (typeof props?.loadPortalData === 'function') {
          props.loadPortalData(sv.salesToken);
        } else {
          window.location.reload();
        }
      } else {
        const errText = await res.text();
        alert('Lỗi từ hệ thống xử lý tài liệu: ' + errText);
      }
    } catch (err) {
      alert('Lỗi kết nối mạng hỏa tốc: ' + err.message);
    } finally {
      setLocalSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '40px max(20px, (100% - 900px)/2)', minHeight: '100vh', background: '#050816', color: 'white' }}>
      
      {/* KHU VỰC THÔNG TIN ĐỊNH DANH NGƯỜI DÙNG RÕ RÀNG */}
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginBottom: '30px', padding: '16px 24px', background: 'linear-gradient(90deg, rgba(59,130,246,0.1) 0%, transparent 100%)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(59,130,246,0.2)', display: 'grid', placeItems: 'center', color: '#3b82f6' }}>
            <Hotel size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', tracking: '0.05em' }}>Vai trò truy cập hệ thống</div>
            <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', margin: '2px 0 0' }}>HOTEL SALES MANAGER</h3>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="status-badge badge-success" style={{ fontSize: '12px', padding: '6px 12px' }}>
            Đối tác: {sv.venueName} ({sv.venueCity})
          </span>
        </div>
      </div>

      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="text-gradient" style={{ fontSize: '28px', fontWeight: '800' }}>CỔNG ĐÀM PHÁN HOTEL SALES MANAGER</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Xử lý đặt phòng & Thương thảo hồ sơ hợp đồng điện tử</p>
      </header>

      <div className="glass-panel glass-panel-glow" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', color: 'white', marginBottom: '14px' }}>
            <FileText size={18} color="var(--accent-primary)" /> Chi tiết yêu cầu giữ phòng sự kiện
          </h3>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '14px' }}>Mã hồ sơ sự kiện: <b style={{ color: 'var(--accent-primary)' }}>{sv.profileId}</b></span>
            <span style={{ fontSize: '14px' }}>Quy mô đại biểu: <b>{sv.expectedAttendees} người</b></span>
            <span style={{ fontSize: '14px' }}>Ngày diễn ra dự kiến: <b>{sv.expectedDate}</b></span>
          </div>
        </div>

        // Khối hiển thị bên trong file PortalSales.jsx
// Hãy tìm đến phần hiển thị sv.estimation và thay thế bằng bảng cấu trúc chuẩn hóa:

        {sv.estimation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* THÊM BẢNG ĐỐI CHIẾU THÔNG TIN ĐỒNG BỘ CHO PHÍA SALES MANAGER */}
            <div style={{ background: 'rgba(99, 102, 241, 0.02)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '20px' }}>
              <h4 style={{ textAlign: 'center', color: 'white', marginBottom: '16px', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Thông Số Kỹ Thuật Phòng Hội Nghị & Dự Toán Quy Mô Yêu Cầu
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#cbd5e1' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #334155', padding: '10px', background: 'rgba(255,255,255,0.01)', fontWeight: 'bold', width: '35%' }}>Mã Hồ Sơ Sự Kiện</td>
                    <td style={{ border: '1px solid #334155', padding: '10px', color: 'white', fontWeight: 'bold' }}>{sv.profileId}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #334155', padding: '10px', background: 'rgba(255,255,255,0.01)', fontWeight: 'bold' }}>Quy Mô Đại Biểu</td>
                    <td style={{ border: '1px solid #334155', padding: '10px', color: 'white' }}><b>{sv.expectedAttendees} Người</b></td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #334155', padding: '10px', background: 'rgba(255,255,255,0.01)', fontWeight: 'bold' }}>Ngày Tổ Chức Chỉ Định</td>
                    <td style={{ border: '1px solid #334155', padding: '10px', color: 'white' }}>{sv.expectedDate}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #334155', padding: '10px', background: 'rgba(255,255,255,0.01)', fontWeight: 'bold' }}>Diện Tích Không Gian Tối Thiểu</td>
                    <td style={{ border: '1px solid #334155', padding: '10px', color: 'var(--success-color)', fontWeight: 'bold' }}>{sv.estimation.minRoomSize} m2</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #334155', padding: '10px', background: 'rgba(255,255,255,0.01)', fontWeight: 'bold' }}>Sơ Đồ Sắp Xếp Bàn Ghế</td>
                    <td style={{ border: '1px solid #334155', padding: '10px', color: 'white' }}>{sv.estimation.setupStyle}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #334155', padding: '10px', background: 'rgba(255,255,255,0.01)', fontWeight: 'bold' }}>Trang Thiết Bị Nghe Nhìn (AV)</td>
                    <td style={{ border: '1px solid #334155', padding: '10px', color: 'white', lineHeight: '1.4' }}>{sv.estimation.avEquipment}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '0' }} />

        {/* 1. KHU VỰC TIẾP NHẬN PHẢN HỒI BAN ĐẦU */}
        {sv.status === 'PENDING' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
            <div className="glass-panel" style={{ background: 'rgba(16,185,129,0.02)', borderColor: 'rgba(16,185,129,0.15)' }}>
              <h3 style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '16px' }}>
                <CheckCircle size={18} /> Đồng ý Tổ chức & Tải lên dự thảo
              </h3>
              <p style={{ fontSize: '13px', marginBottom: '18px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Xác nhận khách sạn có đủ phòng trống và đáp ứng toàn bộ các thông số kỹ thuật AV. Vui lòng đính kèm file mẫu hợp đồng v1 để khởi tạo luồng đàm phán.
              </p>
              <button className="btn btn-success" style={{ width: '100%', padding: '10px' }} onClick={() => setShowConfirmModal(true)}>
                Chấp nhận đặt chỗ & Soạn thảo hợp đồng
              </button>
            </div>

            <form onSubmit={(e) => handleSalesRespond(e, false)} className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.02)', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
              <h3 style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '16px' }}>
                <X size={18} /> Từ chối tiếp nhận
              </h3>
              <div className="form-group">
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '74px', fontSize: '13px' }}
                  placeholder="Vui lòng nêu rõ lý do (Ví dụ: Hết phòng trống, không có sơ đồ bàn ghế phù hợp...)"
                  value={salesRejectReason}
                  onChange={e => setSalesRejectReason(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <button type="submit" className="btn btn-danger" style={{ width: '100%', padding: '10px' }} disabled={isSubmitting}>
                {isSubmitting ? "Đang xử lý gửi..." : "Xác nhận từ chối"}
              </button>
            </form>
          </div>
        )}

        {/* CỬA SỔ MODAL NỔI XÁC NHẬN ĐẶT CHỖ CHẶT CHẼ */}
        {showConfirmModal && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 22, 0.85)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', zIndex: 9999 }}>
            <form onSubmit={(e) => { handleSalesRespond(e, true); setShowConfirmModal(false); }} className="glass-panel slide-in" style={{ width: '100%', maxWidth: '440px', padding: '28px', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', margin: 0 }}>Khởi tạo luồng Hợp đồng v1</h3>
                <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setShowConfirmModal(false)}><X size={18} /></button>
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Tải lên tệp đính kèm dự thảo (*.pdf, *.docx) *</label>
                <input type="file" id="contract-draft" className="form-input" required style={{ padding: '8px' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Đang truyền tải..." : "Xác nhận & Tải lên"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2. LỊCH SỬ PHIÊN BẢN HỢP ĐỒNG ĐÃ ĐÀM PHÁN */}
        {sv.status !== 'PENDING' && sv.status !== 'REJECTED' && (
          <div className="glass-panel" style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '0', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '16px' }}>Tiến trình thương thảo điều khoản hợp đồng</h3>
              <span className={`status-badge ${sv.status === 'SELECTED' ? 'badge-success' : 'badge-logistics'}`}>
                {sv.status === 'SELECTED' ? 'Ký kết chính thức' : 'Đang điều chỉnh'} ({sv.status})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {sv.contracts && sv.contracts.length > 0 ? (
                sv.contracts.map(c => (
                  <div key={c.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '14px 20px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: '800', color: 'var(--accent-primary)', background: 'rgba(99,102,241,0.15)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>v{c.version}</span>
                        <span style={{ fontWeight: '600', fontSize: '14px' }}>{c.fileName}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                        Bên cập nhật: <b style={{ color: c.uploadedBy === 'SALES' ? '#38bdf8' : '#fbbf24' }}>{c.uploadedBy === 'SALES' ? 'KHÁCH SẠN' : 'BAN ĐIỀU PHỐI'}</b> | Nội dung: <i>{c.notes}</i>
                      </p>
                    </div>
                    <a href={`/api/external/contract/${c.id}/download`} className="btn btn-secondary" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <Download size={14} /> Tải về
                    </a>
                  </div>
                ))
              ) : (
                <div style={{ textAlignment: 'center', padding: '20px', color: 'var(--text-muted)' }}>Chưa có tài liệu phiên bản hợp đồng nào được tạo.</div>
              )}
            </div>

            {/* FORM SUBMIT REVISION ĐÃ FIX TRIỆT ĐỂ LỖI ĐƯỜNG DẪN */}
            {sv.status === 'CONTRACT_NEGOTIATION' && (() => {
              const latestContract = sv.contracts && sv.contracts[0];
              const isWaitingForAdmin = latestContract && latestContract.uploadedBy === 'SALES';

              if (isWaitingForAdmin) {
                return (
                  <div style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.06)', borderLeft: '4px solid var(--warning-color)', borderRadius: '8px', fontSize: '13px' }}>
                    <h5 style={{ color: 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '14px' }}>
                      <AlertTriangle size={16} /> Hồ sơ đang chờ phản hồi đánh giá kiểm tra
                    </h5>
                    <p style={{ lineHeight: '1.5', color: 'var(--text-secondary)' }}>Bạn đã tải lên bản điều chỉnh sửa đổi <b>v{latestContract.version}</b> thành công. Quy trình thương thảo tự động chuyển quyền kiểm soát sang Điều phối viên sự kiện của Ban tổ chức sự kiện.</p>
                  </div>
                );
              }

              return (
                <form onSubmit={onRevisionSubmitLocal} className="glass-panel" style={{ background: 'rgba(99, 102, 241, 0.02)', borderColor: 'rgba(99, 102, 241, 0.15)' }}>
                  <h4 style={{ marginBottom: '14px', fontSize: '15px' }}>Phản hồi ý kiến & Tải lên bản Hợp đồng chỉnh sửa mới</h4>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px' }}>Tệp tài liệu đính kèm sửa đổi *</label>
                    <input type="file" id="contract-revision-file" className="form-input" disabled={localSubmitting} required style={{ padding: '6px' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px' }}>Giải trình nội dung sửa đổi điều khoản *</label>
                    <textarea 
                      className="form-input" 
                      style={{ minHeight: '80px', fontSize: '13px' }}
                      placeholder="Mô tả cụ thể lý do điều chỉnh (Ví dụ: Thay đổi chi phí phòng, bổ sung VAT, chỉnh sửa điều khoản phạt hủy...)"
                      value={negotiationNotes}
                      onChange={e => setNegotiationNotes(e.target.value)}
                      disabled={localSubmitting}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }} disabled={localSubmitting}>
                    {localSubmitting ? "Hệ thống đang truyền tải dữ liệu..." : "Xác nhận phản hồi bản sửa đổi hợp đồng"}
                  </button>
                </form>
              );
            })()}

            {/* XÁC NHẬN HOÀN TẤT VÀ BÀN GIAO ẤN PHẨM HẬU CẦN */}
            {sv.status === 'SELECTED' && (() => {
              const approvedCv = sv.contracts && sv.contracts.find(c => c.status === 'APPROVED');
              const showDeliveryConfirm = sv.documentShipped && !sv.documentReceived;
              const isDeliveryConfirmed = sv.documentReceived;

              return (
                <div style={{ padding: '24px', background: 'rgba(16,185,129,0.04)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h4 style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                      <CheckCircle size={18} /> Quy trình đàm phán hợp đồng kinh tế đã đóng chốt phê duyệt!
                    </h4>
                    <p style={{ marginTop: '6px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      Cơ sở hạ tầng phòng họp đã được phân quyền quản lý bảo mật cho sự kiện của bạn. Ban điều phối sự kiện đang hoàn thiện các thủ tục di chuyển vé máy bay và chuẩn bị ấn phẩm sự kiện.
                    </p>
                  </div>
                  
                  {showDeliveryConfirm && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                      <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.06)', borderLeft: '3px solid var(--warning-color)', borderRadius: '4px', marginBottom: '14px', fontSize: '13px', color: 'var(--warning-color)' }}>
                        📦 <b>Thông báo giao vận hàng hỏa tốc:</b> Thùng ấn phẩm (Sách tài liệu, Thẻ tên, Brochures) đã được đóng gói xuất kho. Vui lòng kiểm tra kiểm kê khi nhận bàn giao vật lý tại sảnh chính khách sạn.
                      </div>
                      <button className="btn btn-success" disabled={isSubmitting} style={{ width: '100%', padding: '12px' }} onClick={handleSalesConfirmDelivery}>
                        {isSubmitting ? "Hệ thống đang lưu trạng thái..." : "Xác nhận đã nhận bàn giao và kiểm đếm đủ số lượng ấn phẩm"}
                      </button>
                    </div>
                  )}

                  {isDeliveryConfirmed && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                      <CheckCircle size={16} /> Khách sạn xác nhận đã kiểm đếm và tiếp nhận đầy đủ tài liệu ấn phẩm hội thảo.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}