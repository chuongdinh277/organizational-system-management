import React from 'react';
import { CheckCircle, X, Download, AlertTriangle } from 'lucide-react';

export default function PortalSales({ portalData, salesRejectReason, setSalesRejectReason, isSubmitting, negotiationNotes, setNegotiationNotes, handleSalesRespond, handleSalesUploadRevision, handleSalesConfirmDelivery }) {
  const sv = portalData;
  if (!sv) return null;

  return (
    <div style={{ padding: '40px max(20px, (100% - 900px)/2)', minHeight: '100vh' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="text-gradient" style={{ fontSize: '28px', fontWeight: '800' }}>CỔNG ĐÀM PHÁN HOTEL SALES MANAGER</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Xử lý đặt phòng & Thương thảo hợp đồng</p>
      </header>

      <div className="glass-panel glass-panel-glow" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div>
          <h2>Khách sạn đặt phòng: <span className="text-gradient">{sv.venueName}</span></h2>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '10px' }}>
            <span style={{ fontSize: '14px' }}>Hồ sơ hội thảo: <b>{sv.profileId}</b></span>
            <span style={{ fontSize: '14px' }}>Quy mô: <b>{sv.expectedAttendees} người</b></span>
            <span style={{ fontSize: '14px' }}>Ngày diễn ra: <b>{sv.expectedDate}</b></span>
          </div>
        </div>

        {sv.estimation && (
          <div className="glass-panel" style={{ background: 'rgba(99, 102, 241, 0.03)' }}>
            <h3 style={{ color: 'white', marginBottom: '10px' }}>Biểu mẫu dự toán kỹ thuật yêu cầu:</h3>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
              <li>Kích thước phòng hội thảo tối thiểu: <b>{sv.estimation.minRoomSize} m2</b></li>
              <li>Sắp xếp bàn ghế: <b>{sv.estimation.setupStyle}</b></li>
              <li>Yêu cầu thiết bị nghe nhìn: <b>{sv.estimation.avEquipment}</b></li>
            </ul>
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)' }} />

        {sv.status === 'PENDING' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
            <form onSubmit={(e) => handleSalesRespond(e, true)} className="glass-panel" style={{ background: 'rgba(16,185,129,0.03)' }}>
              <h3 style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                <CheckCircle size={20} /> Đồng ý Tổ chức & Tải Hợp đồng nháp
              </h3>
              <div className="form-group">
                <label className="form-label">Chọn tệp Dự thảo Hợp đồng (.pdf, .docx) *</label>
                <input type="file" id="contract-draft" className="form-input" disabled={isSubmitting} required />
              </div>
              <button type="submit" className="btn btn-success" style={{ width: '100%' }} disabled={isSubmitting}>
                {isSubmitting ? "Đang xử lý..." : "Xác nhận & Tải lên hợp đồng v1"}
              </button>
            </form>

            <form onSubmit={(e) => handleSalesRespond(e, false)} className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.03)' }}>
              <h3 style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                <X size={20} /> Từ chối
              </h3>
              <div className="form-group">
                <label className="form-label">Lý do từ chối *</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '80px' }}
                  placeholder="Nhập lý do khách sạn không thể đáp ứng..."
                  value={salesRejectReason}
                  onChange={e => setSalesRejectReason(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <button type="submit" className="btn btn-danger" style={{ width: '100%' }} disabled={isSubmitting}>
                {isSubmitting ? "Đang gửi..." : "Gửi Từ Chối"}
              </button>
            </form>
          </div>
        )}

        {sv.status !== 'PENDING' && sv.status !== 'REJECTED' && (
          <div className="glass-panel" style={{ background: 'rgba(255, 255, 255, 0.01)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>Đàm phán Lịch sử phiên bản hợp đồng</h3>
              <span className={`status-badge ${sv.status === 'SELECTED' ? 'badge-success' : 'badge-logistics'}`}>
                {sv.status === 'SELECTED' ? 'Hoàn tất đàm phán' : 'Đang đàm phán'} ({sv.status})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
              {sv.contracts && sv.contracts.map(c => (
                <div key={c.id} className="glass-panel" style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.02)', padding: '12px 20px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '800', color: 'var(--accent-primary)' }}>v{c.version}</span>
                      <b>{c.fileName}</b>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Tải lên bởi: <b>{c.uploadedBy}</b> | Nhận xét: <i>{c.notes}</i>
                    </p>
                  </div>
                  <a href={`/api/external/contract/${c.id}/download`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                    <Download size={14} /> Tải xuống
                  </a>
                </div>
              ))}
            </div>

            {sv.status === 'CONTRACT_NEGOTIATION' && (() => {
              const latestContract = sv.contracts && sv.contracts[0];
              const isWaitingForAdmin = latestContract && latestContract.uploadedBy === 'SALES';

              if (isWaitingForAdmin) {
                return (
                  <div style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.08)', borderLeft: '4px solid var(--warning-color)', borderRadius: '8px', fontSize: '13px' }}>
                    <h5 style={{ color: 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <AlertTriangle size={16} /> Đang chờ phản hồi từ Ban điều phối
                    </h5>
                    <p>Bạn đã gửi bản hợp đồng sửa đổi <b>v{latestContract.version}</b>. Vui lòng chờ Điều phối viên (Admin) xem xét phản hồi hoặc phê duyệt hợp đồng chính thức.</p>
                  </div>
                );
              }

              return (
                <form onSubmit={handleSalesUploadRevision} className="glass-panel" style={{ background: 'rgba(99, 102, 241, 0.03)' }}>
                  <h4 style={{ marginBottom: '15px' }}>Gửi phiên bản Hợp đồng chỉnh sửa mới</h4>
                  <div className="form-group">
                    <label className="form-label">Chọn tệp hợp đồng sửa đổi *</label>
                    <input type="file" id="contract-revision-file" className="form-input" disabled={isSubmitting} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ghi chú yêu cầu chỉnh sửa / Giải trình *</label>
                    <textarea 
                      className="form-input" 
                      style={{ minHeight: '80px' }}
                      placeholder="Mô tả các điều khoản đã sửa đổi hoặc thắc mắc..."
                      value={negotiationNotes}
                      onChange={e => setNegotiationNotes(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? "Đang gửi..." : "Gửi Hợp đồng Bản sửa đổi"}
                  </button>
                </form>
              );
            })()}

            {sv.status === 'SELECTED' && (() => {
              const approvedCv = sv.contracts && sv.contracts.find(c => c.status === 'APPROVED');
              const showDeliveryConfirm = portalData.documentShipped && !portalData.documentReceived;
              const isDeliveryConfirmed = portalData.documentReceived;

              return (
                <div style={{ padding: '20px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', border: '1px solid var(--success-color)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <h4 style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={20} /> Hợp đồng đã hoàn thành đàm phán & Phê duyệt chính thức!
                    </h4>
                    <p style={{ marginTop: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Địa điểm tổ chức sự kiện đã bị khóa chính thức. Lịch trình sẽ bắt đầu triển khai di chuyển chuyên gia. Cảm ơn sự hợp tác!
                    </p>
                  </div>
                  {approvedCv && (
                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px' }}>
                        Bản hợp đồng đã chốt phê duyệt: <b>{approvedCv.fileName} (v{approvedCv.version})</b>
                      </div>
                      <a href={`/api/external/contract/${approvedCv.id}/download`} className="btn btn-success" style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Download size={12} /> Tải bản chốt
                      </a>
                    </div>
                  )}
                  {showDeliveryConfirm && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                      <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.08)', borderLeft: '3px solid var(--warning-color)', borderRadius: '4px', marginBottom: '10px', fontSize: '12px' }}>
                        📦 <b>Thông báo vận chuyển:</b> Ban điều phối đã gửi tài liệu ấn phẩm hội thảo đến khách sạn của bạn.
                      </div>
                      <button className="btn btn-success" disabled={isSubmitting} style={{ width: '100%' }} onClick={handleSalesConfirmDelivery}>
                        {isSubmitting ? "Đang xử lý..." : "Xác nhận Đã nhận bàn giao đủ ấn phẩm tài liệu"}
                      </button>
                    </div>
                  )}
                  {isDeliveryConfirmed && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                      <CheckCircle size={16} /> Đã xác nhận bàn giao đủ ấn phẩm tài liệu với Ban điều phối.
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