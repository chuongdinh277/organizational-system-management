import React from 'react';
import { Edit2, X } from 'lucide-react';

export default function PanelReservation({ formData, setFormData, editMode, setEditMode, isSubmitting, profiles, handleCreateProfile, handleUpdateProfile, handleCancelProfile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient">Phân hệ Tiếp nhận & Khởi tạo Hồ sơ</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Tiếp nhận dữ liệu đầu vào và theo dõi trạng thái</p>
        </div>
        <span className="status-badge badge-new">Role: BP Đặt chỗ</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '30px', alignItems: 'start' }}>
        <form onSubmit={editMode ? (e) => handleUpdateProfile(e, editMode) : handleCreateProfile} className="glass-panel">
          <h3 style={{ marginBottom: '20px' }}>{editMode ? "Cập nhật thông tin hồ sơ" : "Tiếp nhận thông tin mới"}</h3>
          
          <div className="form-group">
            <label className="form-label">Loại Hội Thảo *</label>
            <input type="text" className="form-input" value={formData.seminarType} onChange={e => setFormData({...formData, seminarType: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Ngày Tổ Chức Dự Kiến *</label>
            <input type="date" className="form-input" value={formData.expectedDate} onChange={e => setFormData({...formData, expectedDate: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Thành Phố *</label>
            <input type="text" className="form-input" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
          </div>
          
          <div style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '13px', marginBottom: '10px', color: 'var(--accent-primary)' }}>Hồ sơ Chuyên Gia</h4>
            <div className="form-group">
              <label className="form-label">Họ & Tên Chuyên Gia *</label>
              <input type="text" className="form-input" value={formData.expertName} onChange={e => setFormData({...formData, expertName: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Chuyên Gia *</label>
              <input type="email" className="form-input" value={formData.expertEmail} onChange={e => setFormData({...formData, expertEmail: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Điện thoại *</label>
              <input type="text" className="form-input" value={formData.expertPhone} onChange={e => setFormData({...formData, expertPhone: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Số CCCD / Passport (AES-256) *</label>
              <input type="text" className="form-input" value={formData.expertPassport} onChange={e => setFormData({...formData, expertPassport: e.target.value})} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Số đại biểu dự kiến *</label>
            <input type="number" className="form-input" value={formData.expectedAttendees} onChange={e => setFormData({...formData, expectedAttendees: parseInt(e.target.value)})} required />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : (editMode ? "Lưu thay đổi" : "Khởi tạo hồ sơ")}
            </button>
            {editMode && (
              <button type="button" className="btn btn-secondary" onClick={() => {
                setEditMode(null);
                setFormData({
                  seminarType: 'Hội thảo chuyên sâu về AI',
                  expectedDate: '2026-06-15',
                  city: 'Hanoi',
                  expertName: 'Nguyễn Văn Chuyên Gia',
                  expertEmail: 'expert@gmail.com',
                  expertPhone: '0987654321',
                  expertPassport: 'B1234567',
                  expectedAttendees: 50
                });
              }}>Hủy</button>
            )}
          </div>
        </form>

        <div className="glass-panel">
          <h3 style={{ marginBottom: '20px' }}>Danh sách hồ sơ yêu cầu</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>ID Hồ Sơ</th>
                  <th style={{ padding: '12px' }}>Chuyên Gia</th>
                  <th style={{ padding: '12px' }}>Thông Tin</th>
                  <th style={{ padding: '12px' }}>Trạng Thái</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => {
                  const canEdit = p.status === 'Bị từ chối / Tạm dừng' || p.status === 'Mới tạo / Chờ xử lý';
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '12px', fontWeight: '800' }}>{p.id}</td>
                      <td style={{ padding: '12px' }}>
                        <b>{p.expert.name}</b>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.expert.email}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <b>{p.seminarType}</b>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.city} | {p.expectedDate} | {p.expectedAttendees} chỗ</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span className={`status-badge ${
                          p.status === 'Mới tạo / Chờ xử lý' ? 'badge-new' :
                          p.status === 'Đang xử lý hậu cần' ? 'badge-logistics' :
                          p.status === 'Đã chốt địa điểm' ? 'badge-success' :
                          p.status === 'Đang gửi tài liệu' ? 'badge-logistics' :
                          p.status === 'Sẵn sàng tổ chức' ? 'badge-success' :
                          p.status === 'Bị từ chối / Tạm dừng' ? 'badge-rejected' : 'badge-muted'
                        }`}>{p.status}</span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px', minWidth: '32px' }} 
                            disabled={!canEdit}
                            onClick={() => {
                              setEditMode(p.id);
                              setFormData({
                                seminarType: p.seminarType,
                                expectedDate: p.expectedDate,
                                city: p.city,
                                expertName: p.expert.name,
                                expertEmail: p.expert.email,
                                expertPhone: p.expert.phone,
                                expertPassport: p.expert.passportNo,
                                expectedAttendees: p.expectedAttendees
                              });
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-danger" style={{ padding: '6px', minWidth: '32px' }} disabled={!canEdit} onClick={() => handleCancelProfile(p.id)}>
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}