import React from 'react';
import { ShieldCheck, Plus, List, FileText } from 'lucide-react';

export default function Sidebar({ currentRole, profiles, handleManualCountdown, setSelectedProfile, setEditMode }) {
  
  // Hàm chuyển đổi mã Role kỹ thuật từ Database sang chữ hiển thị tiếng Việt tĩnh
  const getRoleLabel = (role) => {
    switch (role) {
      case 'Role_Reservation': 
        return 'BP ĐẶT CHỖ';
      case 'Role_Admin_Logistics': 
        return 'ĐIỀU PHỐI VIÊN';
      case 'Role_Doc_Processor': 
        return 'BP XỬ LÝ TÀI LIỆU';
      default: 
        return 'THÀNH VIÊN';
    }
  };

  return (
    <aside className="glass-panel" style={{ borderRadius: '0', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', height: '100vh', padding: '24px' }}>
      <div>
        {/* Header ứng dụng */}
        <h2 className="text-gradient" style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '25px' }}>
          <ShieldCheck size={24} /> SEMINAR HUB
        </h2>

        {/* THAY THẾ DROP SELECT CŨ: Chỉ hiển thị TEXT TĨNH báo Role hiện tại giống góc màn hình */}
        <div style={{ marginBottom: '25px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            VAI TRÒ ĐANG DÙNG:
          </span>
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: '20px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            color: '#60a5fa',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '0.03em'
          }}>
            ROLE: {getRoleLabel(currentRole)}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', marginBottom: '20px' }} />

        {/* MENU ĐIỀU HƯỚNG THÔNG MINH: Chỉ hiện đúng Panel thuộc quyền, ẩn sạch các Panel khác */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {currentRole === 'Role_Reservation' && (
            <button 
              className="btn btn-primary" 
              style={{ justifyContent: 'start', width: '100%' }}
              onClick={() => {
                if (setEditMode) setEditMode(false);
                if (setSelectedProfile) setSelectedProfile(null);
              }}
            >
              <Plus size={16} /> BP Đặt chỗ Panel
            </button>
          )}
          
          {currentRole === 'Role_Admin_Logistics' && (
            <button 
              className="btn btn-primary" 
              style={{ justifyContent: 'start', width: '100%' }}
              onClick={() => {
                if (setSelectedProfile) setSelectedProfile(null);
              }}
            >
              <List size={16} /> Điều phối viên Panel
            </button>
          )}
          
          {currentRole === 'Role_Doc_Processor' && (
            <button 
              className="btn btn-primary" 
              style={{ justifyContent: 'start', width: '100%' }}
              onClick={() => {
                if (setSelectedProfile) setSelectedProfile(null);
              }}
            >
              <FileText size={16} /> BP Xử lý tài liệu Panel
            </button>
          )}
          
        </nav>
      </div>

      {/* Phần thống kê nằm ở đáy Sidebar */}
      <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
        <h5 style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Thống kê tổng hồ sơ</h5>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
          <div>Tổng số: <b>{profiles?.length || 0}</b></div>
          <div>Sẵn sàng: <b>{profiles?.filter(p => p.status === 'Sẵn sàng tổ chức').length || 0}</b></div>
        </div>
        
        {/* Chỉ duy nhất Admin Logistics mới được thấy nút chạy Job đếm ngược */}
        {currentRole === 'Role_Admin_Logistics' && (
          <button className="btn btn-secondary" style={{ width: '100%', fontSize: '11px', padding: '6px', marginTop: '12px' }} onClick={handleManualCountdown}>
            Chạy Job Đếm Ngược 14 Ngày
          </button>
        )}
      </div>
    </aside>
  );
}