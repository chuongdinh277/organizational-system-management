import React from 'react';
import { Calendar, Users, CheckCircle, X, Plane, Download, Check } from 'lucide-react';

export default function PortalExpert({ portalData, expertScheduleInput, setExpertScheduleInput, isSubmitting, handleExpertAccept, handleExpertReject, handleExpertChooseFlight }) {
  const p = portalData;
  if (!p) return null;

  return (
    <div style={{ padding: '40px max(20px, (100% - 800px)/2)', minHeight: '100vh' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="text-gradient" style={{ fontSize: '28px', fontWeight: '800' }}>CỔNG THÔNG TIN CHUYÊN GIA</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Chốt sự tham gia & Phương án vé máy bay</p>
      </header>

      <div className="glass-panel glass-panel-glow" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div>
          <span className="status-badge badge-new" style={{ marginBottom: '10px' }}>Lời mời hợp tác</span>
          <h2>Kính gửi Chuyên gia: <span className="text-gradient">{p.expertName}</span></h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '10px', lineHeight: '1.6' }}>
            Chúng tôi trân trọng kính mời Ông/Bà tổ chức buổi <b>{p.seminarType}</b> sắp tới diễn ra tại thành phố <b>{p.city}</b>.
          </p>
          <div style={{ marginTop: '15px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
              <Calendar size={16} color="var(--accent-primary)" /> Ngày diễn ra: <b>{p.expectedDate}</b>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
              <Users size={16} color="var(--accent-primary)" /> Quy mô dự kiến: <b>{p.expectedAttendees} người</b>
            </span>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)' }} />

        {p.status === 'Mới tạo / Chờ xử lý' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <form onSubmit={handleExpertAccept} className="glass-panel" style={{ background: 'rgba(16, 185, 129, 0.03)' }}>
              <h3 style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                <CheckCircle size={20} /> Đồng ý Tham gia
              </h3>
              <div className="form-group">
                <label className="form-label">Ngày tổ chức hội thảo chính thức (Cố định) *</label>
                <input type="text" className="form-input" value={p.expectedDate} disabled readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">Lịch trình di chuyển mong muốn *</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '100px' }}
                  placeholder="Ví dụ: Bay từ HN đi SG ngày 14/06 chiều, bay về tối 15/06..."
                  value={expertScheduleInput}
                  onChange={e => setExpertScheduleInput(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <button type="submit" className="btn btn-success" style={{ width: '100%' }} disabled={isSubmitting}>
                {isSubmitting ? "Đang xử lý..." : "Xác nhận Đồng ý"}
              </button>
            </form>

            <form onSubmit={handleExpertReject} className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.03)' }}>
              <h3 style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                <X size={20} /> Từ chối Tham gia
              </h3>
              <div className="form-group">
                <label className="form-label">Lý do từ chối *</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '100px' }}
                  placeholder="Nhập lý do từ chối tổ chức..."
                  value={expertRejectReason}
                  onChange={e => setExpertRejectReason(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <button type="submit" className="btn btn-danger" style={{ width: '100%' }} disabled={isSubmitting}>
                {isSubmitting ? "Đang gửi..." : "Gửi phản hồi Từ chối"}
              </button>
            </form>
          </div>
        )}

        {p.status !== 'Mới tạo / Chờ xử lý' && (
          <div className="glass-panel" style={{ background: 'rgba(255, 255, 255, 0.02)', borderLeft: '4px solid var(--success-color)' }}>
            <h3 style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} /> Lịch trình của bạn đã được chốt thành công!
            </h3>
            {p.desiredSchedule && (
              <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '14px' }}>
                  Ngày tổ chức xác nhận chính thức: <span className="status-badge badge-success" style={{ fontSize: '13px', fontWeight: 'bold' }}>{p.expectedDate}</span>
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Lịch trình chi tiết đã đăng ký: <b style={{ color: 'white' }}>{p.desiredSchedule}</b>
                </p>
              </div>
            )}
            {p.expertNotes && (
              <p style={{ marginTop: '10px', color: 'var(--danger-color)', fontSize: '14px' }}>
                Lý do từ chối: <b>{p.expertNotes}</b>
              </p>
            )}
          </div>
        )}

        {(p.status === 'Đang xử lý hậu cần' || p.status === 'Đã chốt địa điểm' || p.status === 'Đang gửi tài liệu' || p.status === 'Sẵn sàng tổ chức') && p.travelOptions && p.travelOptions.length > 0 && (
          <div className="glass-panel" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
              <Plane size={20} /> Lựa chọn Phương án Vé máy bay & Đưa đón
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '15px' }}>
              Ban điều phối đã thiết lập các phương án bay phù hợp. Vui lòng bấm chọn 1 phương án duy nhất để gửi Yêu cầu xuất vé:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {p.travelOptions.map(opt => {
                const isSelected = opt.status === 'SELECTED';
                const isAnySelected = p.travelOptions.some(o => o.status === 'SELECTED');
                return (
                  <div key={opt.id} className="glass-panel" style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    background: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
                    borderColor: isSelected ? 'var(--success-color)' : 'var(--glass-border)'
                  }}>
                    <div>
                      <p style={{ fontWeight: '600' }}>{opt.flightDetails}</p>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Chi phí ước tính: {opt.estimatedCost} VND</span>
                    </div>
                    {!isAnySelected ? (
                      <button className="btn btn-primary" disabled={isSubmitting} onClick={() => handleExpertChooseFlight(opt.id)}>{isSubmitting ? "Đang chọn..." : "Chọn Phương án này"}</button>
                    ) : (
                      <span className="status-badge badge-success">{opt.status}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {p.ticketCode && (
          <div className="glass-panel" style={{ borderLeft: '4px solid var(--success-color)', background: 'rgba(16,185,129,0.05)' }}>
            <h4 style={{ color: 'var(--success-color)' }}>Vé máy bay đã được đặt chính thức!</h4>
            <p style={{ marginTop: '5px', fontSize: '15px' }}>
              Mã vé (ETicket Code): <span style={{ fontWeight: '800', color: 'white', background: 'var(--danger-color)', padding: '2px 8px', borderRadius: '4px' }}>{p.ticketCode}</span>
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Thông tin lộ trình chi tiết đã được gửi tới email của bạn. Xe đưa đón sẽ liên hệ trước giờ đón.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}