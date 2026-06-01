import React, { useState, useEffect } from 'react';
import { AlertTriangle, Check, Send, Search, FileUp, Download, Plane, CheckCircle, Link2, FileText, FileCheck, Eye, EyeOff, Bell, X } from 'lucide-react';

export default function PanelCoordinator({ 
  profiles, selectedProfile, setSelectedProfile, flightOptions, setFlightOptions, 
  selectedTravelOptions, venueKeyword, setVenueKeyword, suggestedVenues, 
  selectedVenues, selectedContracts, negotiationNotes, setNegotiationNotes, 
  ticketCodeInput, setTicketCodeInput, actualAttendees, setActualAttendees, 
  hotelConfirmed, setHotelConfirmed, isSubmitting, handleSendExpertInvite, 
  handleSearchVenues, handleBookVenue, handleProposeFlights, 
  handleAdminUploadRevision, handleApproveContract, handleBookFlightViaApi, 
  handleUpdateTicket, handleFinalizeDocs, handleCompleteLogistics,
  notifications, setNotifications // Nhận thêm state thông báo để dựng chuông tại bàn làm việc
}) {

  // --- STATE CỤC BỘ QUẢN LÝ MỞ MODAL ĐIỀN THÔNG SỐ GIỮA MÀN HÌNH ---
  const [bookingModalVenue, setBookingModalVenue] = useState(null); 
  
  const [customRequirements, setCustomRequirements] = useState({
    minRoomSize: '',
    setupStyle: 'Classroom',
    avEquipment: ''
  });

  // --- STATE ĐIỀU KHIỂN CHUÔNG THÔNG BÁO ---
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [latestToast, setLatestToast] = useState(null);

  // Đếm số lượng thông báo chưa đọc
  const unreadCount = notifications ? notifications.filter(n => !n.isRead).length : 0;

  // Lắng nghe thông báo mới tinh để nhá nhanh ra góc màn hình trong 4 giây rồi tự ẩn
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const sortedNotifs = [...notifications].sort((a, b) => b.timestamp - a.timestamp);
      const newestNotif = sortedNotifs[0];

      if (!newestNotif.isRead) {
        setLatestToast(newestNotif);
        const timer = setTimeout(() => setLatestToast(null), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);

  // Hàm chuyển đổi trạng thái Đã đọc / Chưa đọc
  const handleToggleReadStatus = (timestamp) => {
    setNotifications(prev => prev.map(n => 
      n.timestamp === timestamp ? { ...n, isRead: !n.isRead } : n
    ));
  };

  // Hàm xóa thông báo khỏi danh sách
  const handleDeleteNotification = (timestamp) => {
    setNotifications(prev => prev.filter(n => n.timestamp !== timestamp));
    if (latestToast && latestToast.timestamp === timestamp) {
      setLatestToast(null);
    }
  };

  // Lọc lấy địa điểm đang tương tác thực tế thuộc hồ sơ sự kiện hiện tại
  const activeVenues = selectedVenues ? selectedVenues.filter(v => v.status === 'PENDING' || v.status === 'CONTRACT_NEGOTIATION' || v.status === 'SELECTED') : [];
  const hasActiveBooking = activeVenues.length > 0;
  const currentSelectedVenue = hasActiveBooking ? activeVenues[0] : null;

  // Lọc lấy bản hợp đồng chính thức duy nhất sau khi bấm phê duyệt chốt cuối
  const approvedContract = selectedContracts ? selectedContracts.find(c => c.status === 'APPROVED') : null;

  // Reset và làm trống form mỗi khi mở Modal Chọn Đặt cho một khách sạn mới
  useEffect(() => {
    if (bookingModalVenue) {
      setCustomRequirements({
        minRoomSize: '',
        setupStyle: 'Classroom',
        avEquipment: ''
      });
    }
  }, [bookingModalVenue]);

  // Tự động đóng Modal khi chuyển đổi sang xem hồ sơ sự kiện khác
  useEffect(() => {
    setBookingModalVenue(null);
  }, [selectedProfile]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', position: 'relative' }}>
      
      {/* POPUP TOAST NHÁ THÔNG BÁO MỚI NHẤT (TỰ ẨN SAU 4 GIÂY) */}
      {latestToast && !isBellOpen && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10001, width: '350px' }}>
          <div className={`glass-panel slide-in ${latestToast.type === 'REJECT' || latestToast.title.includes('CẢNH BÁO') ? 'pulse-alert-red' : ''}`} style={{ background: latestToast.type === 'REJECT' || latestToast.title.includes('CẢNH BÁO') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(17, 24, 39, 0.95)', borderLeft: `4px solid ${latestToast.type === 'SUCCESS' ? 'var(--success-color)' : latestToast.type === 'REJECT' ? 'var(--danger-color)' : 'var(--accent-primary)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', margin: 0, color: 'white' }}>
                {latestToast.title}
              </h4>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setLatestToast(null)}><X size={14} /></button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.4', margin: '6px 0 0' }}>{latestToast.message}</p>
          </div>
        </div>
      )}

      {/* THANH TIÊU ĐỀ TRÊN CÙNG TÍCH HỢP CHIẾC CHUÔNG THÔNG BÁO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient">Bàn làm việc của Điều phối viên (Admin)</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Giám sát trạng thái, kết nối đối tác và xuất tài liệu</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', zIndex: 10000 }}>
          {/* --- CHIẾC CHUÔNG THÔNG BÁO THÔNG MINH --- */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setIsBellOpen(!isBellOpen)}
              className="btn btn-secondary"
              style={{ padding: '10px', borderRadius: '50%', minWidth: '42px', height: '42px', display: 'grid', placeItems: 'center', position: 'relative' }}
            >
              <Bell size={20} color={unreadCount > 0 ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--danger-color)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold', boxShadow: '0 0 10px rgba(239,68,68,0.5)' }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* HỘP BOX THƯ THÔNG BÁO ẨN KHUẤT KHUẤT */}
            {isBellOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setIsBellOpen(false)} />
                <div className="glass-panel" style={{ position: 'absolute', top: '50px', right: '0', width: '380px', maxHeight: '480px', overflowY: 'auto', zIndex: 999, background: '#0b0f19', border: '1px solid var(--glass-border)', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ fontSize: '14px', margin: 0, color: 'white' }}>Tất cả thông báo ({notifications?.length || 0})</h3>
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }} onClick={() => setIsBellOpen(false)}>Đóng</button>
                  </div>

                  {!notifications || notifications.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>Không có thông báo nào.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[...notifications].sort((a, b) => b.timestamp - a.timestamp).map((n, i) => (
                        <div key={i} className="glass-panel" style={{ padding: '10px', fontSize: '13px', background: n.isRead ? 'rgba(255,255,255,0.01)' : 'rgba(99, 102, 241, 0.06)', borderColor: n.isRead ? 'var(--glass-border)' : 'var(--accent-primary)', opacity: n.isRead ? 0.65 : 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: n.isRead ? 'normal' : 'bold', color: n.isRead ? 'var(--text-secondary)' : 'white', margin: 0 }}>
                              {n.title}
                            </h4>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                              <button 
                                title={n.isRead ? "Đánh dấu Chưa đọc" : "Đánh dấu Đã đọc"} 
                                style={{ background: 'none', border: 'none', color: n.isRead ? 'var(--text-muted)' : 'var(--success-color)', cursor: 'pointer', padding: 0 }} 
                                onClick={() => handleToggleReadStatus(n.timestamp)}
                              >
                                {n.isRead ? <EyeOff size={14} /> : <Check size={14} />}
                              </button>
                              <button 
                                title="Xóa" 
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }} 
                                onClick={() => handleDeleteNotification(n.timestamp)}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4', margin: '4px 0 0' }}>{n.message}</p>
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
          <span className="status-badge badge-logistics">Role: Admin Logistics</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px', alignItems: 'start' }}>
        
        {/* DANH SÁCH HỒ SƠ BÊN TRÁI */}
        <div className="glass-panel">
          <h3 style={{ marginBottom: '15px' }}>Hồ sơ đang xử lý</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profiles.map(p => {
              const isSelected = selectedProfile && selectedProfile.id === p.id;
              const has14DayWarning = p.documentWarning;
              return (
                <div key={p.id} className={`glass-panel ${isSelected ? 'glass-panel-glow' : ''} ${has14DayWarning ? 'pulse-alert-red' : ''}`} style={{ 
                  cursor: 'pointer', padding: '16px', background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.02)',
                  borderColor: isSelected ? 'var(--accent-primary)' : has14DayWarning ? 'var(--danger-color)' : 'var(--glass-border)'
                }} onClick={() => setSelectedProfile(p)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '800' }}>{p.id}</span>
                    <span className={`status-badge ${
                      p.status === 'Mới tạo / Chờ xử lý' ? 'badge-new' :
                      p.status === 'Đang xử lý hậu cần' ? 'badge-logistics' :
                      p.status === 'Đã chốt địa điểm' ? 'badge-success' :
                      p.status === 'Đang gửi tài liệu' ? 'badge-logistics' :
                      p.status === 'Sẵn sàng tổ chức' ? 'badge-success' :
                      p.status === 'Bị từ chối / Tạm dừng' ? 'badge-rejected' : 'badge-muted'
                    }`}>{p.status}</span>
                  </div>
                  <h4 style={{ marginTop: '8px', fontSize: '14px' }}>{p.seminarType}</h4>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHI TIẾT BIỂU MẪU HẬU CẦN BÊN PHẢI */}
        <div className="glass-panel">
          {selectedProfile ? (
            <div>
              <h2 className="text-gradient" style={{ marginBottom: '20px' }}>Hậu cần Chi tiết: {selectedProfile.id}</h2>

              {selectedProfile.status === 'Bị từ chối / Tạm dừng' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-color)', borderRadius: '8px', marginBottom: '20px', color: 'var(--danger-color)' }}>
                  <AlertTriangle size={20} />
                  <div>
                    <b>Hồ sơ đang bị tạm dừng hoặc đối tác từ chối đàm phán!</b>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Hệ thống tự động mở khóa trạng thái đàm phán địa điểm để thiết lập lại.</p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {/* 1. Mời Chuyên gia */}
                <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <h4>1. Mời Chuyên gia</h4>
                  <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    <div>Chuyên gia: <b>{selectedProfile.expert.name}</b></div>
                    {!selectedProfile.expertToken ? (
                      <button type="button" className="btn btn-primary" onClick={() => handleSendExpertInvite(selectedProfile.id)}><Send size={14} /> Gửi Email Lời mời tự động</button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="status-badge badge-success">Đã gửi link</span>
                        <input type="text" className="form-input" style={{ padding: '6px', fontSize: '11px', width: '180px' }} readOnly value={`${window.location.origin}/?token=${selectedProfile.expertToken}`} />
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Thiết lập Phương án Vé máy bay */}
                {(selectedProfile.status === 'Đang xử lý hậu cần' || selectedProfile.status === 'Đã chốt địa điểm' || selectedProfile.status === 'Đang gửi tài liệu' || selectedProfile.status === 'Sẵn sàng tổ chức') && (
                  <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <h4>2. Thiết lập Phương án Vé máy bay</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '12px 0' }}>
                      {flightOptions.map((opt, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px' }}>
                          <input type="text" className="form-input" style={{ flex: 2, fontSize: '12px' }} value={opt.flightDetails} disabled={selectedTravelOptions.length > 0} onChange={e => { const copy = [...flightOptions]; copy[i].flightDetails = e.target.value; setFlightOptions(copy); }} />
                          <input type="number" className="form-input" style={{ flex: 1, fontSize: '12px' }} value={opt.estimatedCost} disabled={selectedTravelOptions.length > 0} onChange={e => { const copy = [...flightOptions]; copy[i].estimatedCost = e.target.value; setFlightOptions(copy); }} />
                        </div>
                      ))}
                    </div>
                    <button type="button" className="btn btn-primary" onClick={() => handleProposeFlights(selectedProfile.id)} disabled={selectedTravelOptions.length > 0}><Send size={14} /> Gửi phương án</button>
                  </div>
                )}

                {/* 3. Địa điểm & Thương thảo Hợp đồng */}
                <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <h4>3. Địa điểm & Thương thảo Hợp đồng</h4>

                  {!currentSelectedVenue && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', gap: '10px', margin: '12px 0' }}>
                        <input type="text" className="form-input" placeholder="Nhập tên thành phố..." value={venueKeyword} onChange={e => setVenueKeyword(e.target.value)} />
                        <button type="button" className="btn btn-secondary" onClick={() => handleSearchVenues(venueKeyword, selectedProfile.expectedAttendees)}><Search size={14} /> Tìm gợi ý</button>
                      </div>

                      {suggestedVenues.map(v => (
                        <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', marginBottom: '8px', borderRadius: '6px', fontSize: '13px', alignItems: 'center' }}>
                          <div><b>{v.name}</b> (Sức chứa: {v.capacity} người)</div>
                          <button 
                            type="button" 
                            className="btn btn-primary" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setBookingModalVenue(v);
                            }}
                          >
                            Chọn Đặt
                          </button> 
                        </div>
                      ))}
                    </div>
                  )}

                  {currentSelectedVenue && (
                    <div style={{ marginTop: '14px' }}>
                      <div style={{ padding: '14px', background: 'rgba(59, 130, 246, 0.05)', borderLeft: '4px solid #3b82f6', borderRadius: '8px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Địa điểm đàm phán trực tuyến:</div>
                        <b style={{ color: 'white', fontSize: '16px' }}>{currentSelectedVenue.venueName}</b>
                        <span className="status-badge badge-logistics" style={{ marginLeft: '10px' }}>{currentSelectedVenue.status}</span>
                        
                        {currentSelectedVenue.salesToken && (
                          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center', background: '#0b0f19', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {`${window.location.origin}/sales-portal?token=${currentSelectedVenue.salesToken}`}
                            </span>
                            <button type="button" className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => window.open(`${window.location.origin}/sales-portal?token=${currentSelectedVenue.salesToken}`, '_blank')}>Xem trang đàm phán</button>
                          </div>
                        )}
                      </div>

                      {selectedContracts && selectedContracts.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                          <h5 style={{ fontSize: '13px', color: 'white' }}><FileText size={14} style={{ marginRight: '6px' }} /> Lịch sử thương thảo điều khoản:</h5>
                          {selectedContracts.map(c => (
                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--glass-border)', alignItems: 'center' }}>
                              <div>
                                <span style={{ fontWeight: '800', color: 'var(--accent-primary)', marginRight: '8px' }}>v{c.version}</span>
                                <span style={{ fontSize: '13px' }}>{c.fileName}</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>({c.uploadedBy === 'SALES' ? 'Khách sạn gửi' : 'Bạn điều chỉnh'})</span>
                              </div>
                              <a href={`/api/external/contract/${c.id}/download`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}><Download size={12} /> Tải về</a>
                            </div>
                          ))}
                        </div>
                      )}

                      {(currentSelectedVenue.status === 'CONTRACT_NEGOTIATION' || (currentSelectedVenue.status === 'PENDING' && selectedContracts.length > 0)) && (
                        <form onSubmit={(e) => handleAdminUploadRevision(e, selectedProfile.id)} className="glass-panel" style={{ background: 'rgba(255,255,255,0.01)', padding: '16px', borderColor: 'rgba(255,255,255,0.05)' }}>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '12px' }}>Phản hồi bản điều chỉnh hợp đồng mới (.pdf, .docx):</label>
                            <input type="file" id="admin-contract-revision-file" className="form-input" required style={{ padding: '6px' }} />
                          </div>
                          <div className="form-group" style={{ marginTop: '8px' }}>
                            <input type="text" className="form-input" placeholder="Ghi chú nội dung chỉnh sửa giải trình..." value={negotiationNotes} onChange={e => setNegotiationNotes(e.target.value)} required />
                          </div>
                          <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                            <button type="submit" className="btn btn-secondary" style={{ flex: 1, padding: '10px' }}><FileUp size={14} /> Gửi phản hồi sửa đổi (Feedback)</button>
                            <button type="button" className="btn btn-success" style={{ flex: 1, padding: '10px' }} onClick={() => handleApproveContract(selectedProfile.id)}><CheckCircle size={14} /> Phê duyệt chốt hợp đồng cuối</button>
                          </div>
                        </form>
                      )}

                      {currentSelectedVenue.status === 'SELECTED' && approvedContract && (
                        <div style={{ padding: '16px', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px' }}>
                          <h5 style={{ fontSize: '14px', color: 'var(--success-color)', marginBottom: '10px', fontWeight: 'bold' }}>✓ Quy trình đàm phán đóng chốt! Hợp đồng kinh tế đã được ký kết</h5>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0b0f19', padding: '12px 16px', borderRadius: '6px' }}>
                            <span style={{ fontSize: '13px' }}>{approvedContract.fileName} (Phiên bản cuối chốt: v{approvedContract.version})</span>
                            <a href={`/api/external/contract/${approvedContract.id}/download`} className="btn btn-success" style={{ padding: '8px 14px', fontSize: '12px' }}><Download size={14} /> Tải file chốt</a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Quản lý vé máy bay di chuyển */}
                {(selectedProfile.status === 'Đã chốt địa điểm' || selectedProfile.status === 'Đang gửi tài liệu' || selectedProfile.status === 'Sẵn sàng tổ chức') && (
                  <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <h4>4. Quản lý Đi lại & Đặt vé</h4>
                    {selectedProfile.ticketCode ? (
                      <div style={{ background: 'rgba(16,185,129,0.05)', padding: '12px', borderRadius: '4px', border: '1px solid var(--success-color)' }}>Mã vé đã chốt: <b>{selectedProfile.ticketCode}</b></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {selectedTravelOptions.some(opt => opt.status === 'SELECTED') && (
                          <button type="button" className="btn btn-success" onClick={() => handleBookFlightViaApi(selectedProfile.id)}><Plane size={16} /> Gọi API Đặt Vé Tự Động</button>
                        )}
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input type="text" className="form-input" placeholder="Mã vé thủ công..." value={ticketCodeInput} onChange={e => setTicketCodeInput(e.target.value)} />
                          <button type="button" className="btn btn-primary" onClick={() => handleUpdateTicket(selectedProfile.id)}>Cập nhật</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. VẬN CHUYỂN TÀI LIỆU HẬU CẦN */}
                {(selectedProfile.status === 'Đã chốt địa điểm' || selectedProfile.status === 'Đang gửi tài liệu' || selectedProfile.status === 'Sẵn sàng tổ chức') && (
                  <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <h4>5. Kết xuất Ấn phẩm & Chốt Quy trình Hậu cần</h4>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'end', marginTop: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Số đại biểu thực tế tham gia hội thảo *</label>
                        <input type="number" className="form-input" placeholder="Nhập số đại biểu thực tế..." value={actualAttendees} onChange={e => setActualAttendees(e.target.value)} disabled={selectedProfile.documentShipped} />
                      </div>
                      <button type="button" className="btn btn-primary" onClick={() => handleFinalizeDocs(selectedProfile.id)} disabled={selectedProfile.documentShipped}>Xuất lệnh sản xuất tài liệu</button>
                    </div>

                    {selectedProfile.documentShipped && (
                      <div style={{ marginTop: '14px', background: '#0b0f19', padding: '14px', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`status-badge ${selectedProfile.documentReady ? 'badge-success' : 'badge-logistics'}`}>
                            {selectedProfile.documentReady ? "Bộ phận in ấn: ĐÃ ĐÓNG GÓI XONG" : "Bộ phận in ấn: ĐANG CHỜ ĐÓNG GÓI Vật tư"}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`status-badge ${selectedProfile.documentReceived ? 'badge-success' : 'badge-rejected'}`}>
                            {selectedProfile.documentReceived ? "Khách sạn đối tác: ĐÃ TIẾP NHẬN ĐỦ HÀNG" : "Khách sạn đối tác: CHƯA XÁC NHẬN NHẬN HÀNG"}
                          </span>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '8px 0' }} />
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={hotelConfirmed} onChange={e => setHotelConfirmed(e.target.checked)} />
                            Xác nhận kiểm chéo đối tác đã tiếp nhận đủ và đúng số lượng ấn phẩm học liệu
                          </label>
                        </div>
                        
                        <button type="button" className="btn btn-success" style={{ width: '100%', padding: '10px', marginTop: '4px' }} onClick={() => handleCompleteLogistics(selectedProfile.id)}>
                          XÁC NHẬN HOÀN TẤT TOÀN BỘ QUY TRÌNH HẬU CẦN SUỐT SỰ KIỆN
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}><AlertTriangle size={48} style={{ margin: '0 auto', opacity: '0.4' }} /><p style={{ marginTop: '10px' }}>Chọn hồ sơ bên trái để xử lý hậu cần.</p></div>
          )}
        </div>
      </div>

      {/* --- CỬA SỔ MODAL NỔI CHÍNH GIỮA MÀN HÌNH ĐỂ ĐIỀN THÔNG SỐ GỬI SALES --- */}
      {bookingModalVenue && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 22, 0.85)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', zIndex: 99999 }}>
          <div className="glass-panel slide-in" style={{ width: '100%', maxWidth: '500px', padding: '24px', border: '1px solid var(--accent-primary)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                📋 ĐIỀN THÔNG SỐ KỸ THUẬT GỬI ĐỐI TÁC KHÁCH SẠN
              </h3>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setBookingModalVenue(null)}><X size={18} /></button>
            </div>

            <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '6px', fontSize: '13px' }}>
              <div>Gửi phiếu yêu cầu đặt phòng tới: <b style={{ color: 'white' }}>{bookingModalVenue.name}</b></div>
              <div>Quy mô đại biểu phân bổ: <b>{selectedProfile?.expectedAttendees} đại biểu dự kiến</b></div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              // ĐÃ SỬA CỨNG: Truyền thêm state `customRequirements` vào tham số thứ 3 để Frontend không nuốt mất dữ liệu nhập tay nữa
              await handleBookVenue(selectedProfile.id, bookingModalVenue.id, customRequirements);
              setBookingModalVenue(null);
            }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px' }}>Kích thước không gian phòng hội trường tối thiểu (m2) *</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Nhập diện tích m2 yêu cầu..."
                  value={customRequirements.minRoomSize} 
                  onChange={e => setCustomRequirements({...customRequirements, minRoomSize: e.target.value})} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px' }}>Sơ đồ setup bàn ghế hội trường chỉ định *</label>
                <select 
                  className="form-input" 
                  style={{ background: '#0b0f19', color: 'white' }}
                  value={customRequirements.setupStyle} 
                  onChange={e => setCustomRequirements({...customRequirements, setupStyle: e.target.value})}
                >
                  <option value="U-Shape (Chữ U)">U-Shape (Chữ U) - Thích hợp Workshop sự kiện</option>
                  <option value="Classroom">Classroom (Lớp học) - Thích hợp Đào tạo chuyên đề</option>
                  <option value="Theater">Theater (Nhà hát) - Thích hợp Hội nghị diễn đàn lớn</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px' }}>Hạng mục trang thiết bị âm thanh, ánh sáng, tivi, máy chiếu yêu cầu *</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '100px', fontSize: '12px', lineHeight: '1.4' }}
                  placeholder="Điền tay yêu cầu thiết bị tại đây. Ví dụ: Cần 1 máy chiếu công suất lớn, 2 tivi LCD phụ, hệ thống âm thanh nổi, 4 micro không dây..."
                  value={customRequirements.avEquipment} 
                  onChange={e => setCustomRequirements({...customRequirements, avEquipment: e.target.value})} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setBookingModalVenue(null)}>Hủy bỏ</button>
                <button 
                  type="submit" 
                  className="btn btn-success" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Hệ thống đang truyền tải dữ liệu..." : "Xác nhận gửi yêu cầu sang Khách sạn"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}