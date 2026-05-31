import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function PanelDocProcessor({ profiles, selectedProfile, setSelectedProfile, isSubmitting, fetchProfiles }) {
  const pendingDocs = profiles.filter(p => p.documentShipped);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient">Phân hệ Xử lý & Chuẩn bị Tài liệu</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Quản lý in ấn, đóng gói và xác nhận hoàn tất ấn phẩm hội thảo</p>
        </div>
        <span className="status-badge badge-success">Role: BP Xử lý tài liệu</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px', alignItems: 'start' }}>
        <div className="glass-panel">
          <h3 style={{ marginBottom: '15px' }}>Yêu cầu ấn phẩm cần xử lý</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingDocs.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Chưa có yêu cầu xuất kho ấn phẩm nào được gửi tới.</p>
            ) : (
              pendingDocs.map(p => {
                const isSelected = selectedProfile && selectedProfile.id === p.id;
                return (
                  <div key={p.id} className={`glass-panel ${isSelected ? 'glass-panel-glow' : ''}`} style={{ cursor: 'pointer', padding: '16px', background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)', borderColor: isSelected ? 'var(--success-color)' : 'var(--glass-border)' }} onClick={() => setSelectedProfile(p)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '800' }}>{p.id}</span>
                      <span className={`status-badge ${p.documentReady ? 'badge-success' : 'badge-logistics'}`}>{p.documentReady ? 'Đã chuẩn bị xong' : 'Chờ chuẩn bị'}</span>
                    </div>
                    <h4 style={{ marginTop: '8px', fontSize: '14px' }}>{p.seminarType}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Số lượng đại biểu chốt: <b>{p.actualAttendees} người</b></p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="glass-panel">
          {selectedProfile && selectedProfile.documentShipped ? (
            <div>
              <h3 style={{ marginBottom: '20px' }}>Chi tiết lệnh chuẩn bị tài liệu: <span className="text-gradient">{selectedProfile.id}</span></h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <h4 style={{ marginBottom: '12px', color: 'var(--accent-primary)' }}>Định mức chuẩn xuất kho ấn phẩm:</h4>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', paddingLeft: '15px' }}>
                    <li>Sách tài liệu hội thảo: <b>{selectedProfile.actualAttendees} cuốn</b></li>
                    <li>Brochures tờ rơi: <b>{selectedProfile.actualAttendees * 2} tờ</b></li>
                    <li>Thẻ tên đại biểu: <b>{selectedProfile.actualAttendees} thẻ</b></li>
                  </ul>
                </div>

                <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <h4>Địa chỉ giao hàng hội thảo:</h4>
                  <p style={{ fontSize: '14px', marginTop: '6px' }}>Vận chuyển hỏa tốc đến: <b>Khách sạn đối tác tại thành phố {selectedProfile.city}</b></p>
                </div>

                {selectedProfile.documentReady ? (
                  <div style={{ padding: '20px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', border: '1px solid var(--success-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle size={24} color="var(--success-color)" />
                    <div>
                      <h4 style={{ color: 'var(--success-color)' }}>Đã hoàn tất chuẩn bị & Đóng gói!</h4>
                    </div>
                  </div>
                ) : (
                  <button 
                    className="btn btn-success" 
                    disabled={isSubmitting} 
                    style={{ width: '100%', padding: '12px' }}
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/seminars/${selectedProfile.id}/doc-ready`, { method: 'POST' });
                        if (res.ok) {
                          alert("Đã xác nhận đóng gói xong tài liệu! Hệ thống đã gửi thông báo tự động cho Ban điều phối.");
                          fetchProfiles();
                          setSelectedProfile(null);
                        }
                      } catch (e) { alert(e); }
                    }}
                  >
                    {isSubmitting ? "Đang xử lý..." : "Xác nhận Đã hoàn tất & Đóng gói xong tài liệu"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}><AlertTriangle size={48} style={{ margin: '0 auto', opacity: '0.4' }} /><p style={{ marginTop: '10px' }}>Vui lòng chọn một lệnh ấn phẩm cần chuẩn bị ở bên trái.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}