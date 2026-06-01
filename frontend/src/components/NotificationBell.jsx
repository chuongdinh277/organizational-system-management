import React, { useState, useEffect } from 'react';
import { Bell, Check, Eye, EyeOff, X } from 'lucide-react';

export default function NotificationBell({ notifications, setNotifications }) {
  const [isOpen, setIsOpen] = useState(false);
  const [latestNotify, setLatestNotify] = useState(null);

  // Đếm số lượng thông báo chưa đọc (mặc định nếu chưa có thuộc tính isRead thì coi như chưa đọc)
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Mỗi khi có thông báo mới tinh xuất hiện, tự động bắt lấy thông báo mới nhất để hiển thị nhanh
  useEffect(() => {
    if (notifications.length > 0) {
      const sorted = [...notifications].sort((a, b) => b.timestamp - a.timestamp);
      const newest = sorted[0];
      
      // Chỉ hiển thị cảnh báo nhanh nếu thông báo này chưa đọc
      if (!newest.isRead) {
        setLatestNotify(newest);
        // Tự động ẩn thông báo mới nhất sau 4 giây cho đỡ vướng màn hình
        const timer = setTimeout(() => setLatestNotify(null), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);

  // Hàm chuyển đổi trạng thái Đã đọc <-> Chưa đọc
  const toggleReadStatus = (timestamp) => {
    setNotifications(prev => prev.map(n => 
      n.timestamp === timestamp ? { ...n, isRead: !n.isRead } : n
    ));
  };

  // Hàm xóa một thông báo khỏi danh sách
  const deleteNotification = (timestamp) => {
    setNotifications(prev => prev.filter(n => n.timestamp !== timestamp));
    if (latestNotify && latestNotify.timestamp === timestamp) {
      setLatestNotify(null);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      
      {/* --- BIỂU TƯỢNG CHIẾC CHUÔNG --- */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="btn btn-secondary" 
        style={{ padding: '10px', position: 'relative', borderRadius: '50%', minWidth: '42px', height: '42px' }}
      >
        <Bell size={20} color={unreadCount > 0 ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: 'var(--danger-color)', color: 'white',
            borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* --- POP-UP CHỈ HIỂN THỊ THÔNG BÁO MỚI NHẤT (TOAST NHÁ NHANH) --- */}
      {latestNotify && !isOpen && (
        <div className="glass-panel slide-in pulse-alert-red" style={{
          position: 'fixed', top: '80px', right: '20px', width: '320px', zIndex: 10001,
          background: 'rgba(17, 24, 39, 0.95)', borderLeft: '4px solid var(--accent-primary)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>📢 THÔNG BÁO MỚI NHẤT</span>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setLatestNotify(null)}>
              <X size={14} />
            </button>
          </div>
          <h4 style={{ fontSize: '13px', marginTop: '4px', color: 'white' }}>{latestNotify.title}</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{latestNotify.message}</p>
        </div>
      )}

      {/* --- DANH SÁCH TẤT CẢ THÔNG BÁO KHI BẤM VÀO CHUÔNG --- */}
      {isOpen && (
        <>
          {/* Lớp nền mờ hỗ trợ bấm ra ngoài để đóng chuông */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setIsOpen(false)} />
          
          <div className="glass-panel" style={{
            position: 'absolute', top: '50px', right: '0', width: '380px', maxHeigh: '500px',
            overflowY: 'auto', zIndex: 1000, background: '#0b0f19', border: '1px solid var(--glass-border)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontSize: '14px', margin: 0, color: 'white' }}>Tất cả thông báo ({notifications.length})</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }} onClick={() => setIsOpen(false)}>Đóng</button>
            </div>

            {notifications.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>Không có thông báo nào.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...notifications].sort((a, b) => b.timestamp - a.timestamp).map((n) => (
                  <div 
                    key={n.timestamp} 
                    className="glass-panel" 
                    style={{ 
                      padding: '10px', fontSize: '13px',
                      background: n.isRead ? 'rgba(255,255,255,0.01)' : 'rgba(99, 102, 241, 0.05)',
                      borderColor: n.isRead ? 'var(--glass-border)' : 'var(--accent-primary)',
                      opacity: n.isRead ? 0.7 : 1
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: n.isRead ? 'normal' : 'bold', color: n.isRead ? 'var(--text-secondary)' : 'white' }}>
                        {n.title}
                      </h4>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        
                        {/* Nút Đã đọc / Chưa đọc */}
                        <button 
                          title={n.isRead ? "Đánh dấu là chưa đọc" : "Đánh dấu là đã đọc"}
                          style={{ background: 'none', border: 'none', color: n.isRead ? 'var(--text-muted)' : 'var(--success-color)', cursor: 'pointer', padding: '2px' }}
                          onClick={() => toggleReadStatus(n.timestamp)}
                        >
                          {n.isRead ? <EyeOff size={14} /> : <Check size={14} />}
                        </button>

                        {/* Nút Xóa thông báo */}
                        <button 
                          title="Xóa thông báo"
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }} 
                          onClick={() => deleteNotification(n.timestamp)}
                        >
                          <X size={14} />
                        </button>

                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{n.message}</p>
                    
                    {/* Badge trạng thái chữ hiển thị nhỏ gọn */}
                    <span style={{ fontSize: '10px', color: n.isRead ? 'var(--text-muted)' : 'var(--success-color)', display: 'block', marginTop: '6px', textAlign: 'right' }}>
                      {n.isRead ? "✓ Đã đọc" : "● Chưa đọc"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}