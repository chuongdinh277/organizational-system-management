import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Bell, Check, EyeOff } from 'lucide-react';

import AuthPage from './pages/AuthPage.jsx';
import PortalExpert from './components/PortalExpert.jsx';
import PortalSales from './components/PortalSales.jsx';
import Sidebar from './components/Sidebar.jsx';
import PanelReservation from './components/PanelReservation.jsx';
import PanelCoordinator from './components/PanelCoordinator.jsx';
import PanelDocProcessor from './components/PanelDocProcessor.jsx';

import useAppLogic from './hooks/useAppLogic';

export default function App() {
  const logic = useAppLogic();
  const {
    currentRole, setCurrentRole, profiles, selectedProfile, setSelectedProfile,
    notifications, editMode, setEditMode, isSubmitting,
    portalToken, portalType, portalData,
    formData, setFormData,
    venueKeyword, setVenueKeyword, suggestedVenues,
    selectedContracts, selectedVenues, selectedTravelOptions,
    flightOptions, setFlightOptions,
    negotiationNotes, setNegotiationNotes,
    actualAttendees, setActualAttendees,
    hotelConfirmed, setHotelConfirmed,
    ticketCodeInput, setTicketCodeInput,
    expertScheduleInput, setExpertScheduleInput,
    handleCreateProfile, handleUpdateProfile, handleCancelProfile, handleSendExpertInvite,
    handleSearchVenues, handleBookVenue, handleApproveContract, handleProposeFlights,
    handleUpdateTicket, handleBookFlightViaApi, handleFinalizeDocs, handleCompleteLogistics,
    handleExpertAccept, handleExpertReject, handleExpertChooseFlight,
    handleSalesRespond, handleSalesUploadRevision, handleSalesConfirmDelivery,
    handleSalesRejectReason, setSalesRejectReason, // Sửa nhẹ thuộc tính tránh lỗi reference
    handleAdminUploadRevision, handleManualCountdown, setNotifications, fetchProfiles
  } = logic;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  // --- TRẠNG THÁI ĐIỀU KHIỂN CHUÔNG THÔNG BÁO ---
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [latestToast, setLatestToast] = useState(null);

  // Tính toán số lượng thông báo chưa đọc (Mặc định chưa có trường isRead thì coi như chưa đọc)
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Lắng nghe danh sách thông báo để tự động bắt và nháy tin nhắn mới nhất ra màn hình
  useEffect(() => {
    if (notifications.length > 0) {
      const sortedNotifs = [...notifications].sort((a, b) => b.timestamp - a.timestamp);
      const newestNotif = sortedNotifs[0];

      // Nếu thông báo mới nhất chưa đọc, tiến hành nháy popup nhanh
      if (!newestNotif.isRead) {
        setLatestToast(newestNotif);
        const timer = setTimeout(() => setLatestToast(null), 4000); // 4 giây tự ẩn
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

  // Hàm xóa thông báo ra khỏi danh sách
  const handleDeleteNotification = (timestamp) => {
    setNotifications(prev => prev.filter(n => n.timestamp !== timestamp));
    if (latestToast && latestToast.timestamp === timestamp) {
      setLatestToast(null);
    }
  };

  // Ép đồng bộ vai trò của Session người dùng vào biến trạng thái hệ thống ngay khi đăng nhập thành công
  const handleLoginSuccess = (userInfo) => {
    setIsAuthenticated(true);
    setAuthUser(userInfo);
    if (userInfo && userInfo.role) {
      setCurrentRole(userInfo.role);
    }
  };

  // Đồng bộ lại vai trò một lần nữa trong trường hợp hook logic thay đổi trạng thái bất ngờ
  useEffect(() => {
    if (isAuthenticated && authUser && authUser.role) {
      if (currentRole !== authUser.role) {
        setCurrentRole(authUser.role);
      }
    }
  }, [currentRole, isAuthenticated, authUser]);

  // 1. CHẶN BẢO MẬT ĐẦU VÀO: Chưa xác thực thì bắt buộc đứng ở AuthPage
  if (!isAuthenticated && !portalToken) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. PHÂN HỆ LINK ĐỐI TÁC NGOÀI (EXTERNAL PORTAL)
  if (portalToken && portalType) {
    if (portalType === 'expert') {
      return (
        <PortalExpert 
          portalData={portalData} expertScheduleInput={expertScheduleInput} setExpertScheduleInput={setExpertScheduleInput}
          isSubmitting={isSubmitting} handleExpertAccept={handleExpertAccept} handleExpertReject={handleExpertReject} handleExpertChooseFlight={handleExpertChooseFlight}
        />
      );
    }
    if (portalType === 'sales') {
      return (
        <PortalSales 
          portalData={portalData} salesRejectReason={handleSalesRejectReason} setSalesRejectReason={setSalesRejectReason}
          isSubmitting={isSubmitting} negotiationNotes={negotiationNotes} setNegotiationNotes={setNegotiationNotes}
          handleSalesRespond={handleSalesRespond} handleSalesUploadRevision={handleSalesUploadRevision} handleSalesConfirmDelivery={handleSalesConfirmDelivery}
        />
      );
    }
  }

  // 3. PHÂN HỆ NỘI BỘ KIỂM SOÁT CỨNG (INTERNAL HUB DOCKER)
  if (isAuthenticated) {
    return (
      <div className="dashboard-grid">
        
        {/* --- POPUP TOAST NHÁ THÔNG BÁO MỚI NHẤT (TỰ ẨN SAU 4 GIÂY) --- */}
        {latestToast && !isBellOpen && (
          <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10001, width: '350px' }}>
            <div className={`glass-panel slide-in ${latestToast.type === 'REJECT' || latestToast.title.includes('CẢNH BÁO') ? 'pulse-alert-red' : ''}`} style={{ background: latestToast.type === 'REJECT' || latestToast.title.includes('CẢNH BÁO') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(17, 24, 39, 0.95)', borderLeft: `4px solid ${latestToast.type === 'SUCCESS' ? 'var(--success-color)' : latestToast.type === 'REJECT' ? 'var(--danger-color)' : 'var(--accent-primary)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  {latestToast.type === 'SUCCESS' ? <CheckCircle size={16} color="var(--success-color)" /> : <AlertTriangle size={16} color={latestToast.type === 'REJECT' ? 'var(--danger-color)' : 'var(--warning-color)'} />}
                  {latestToast.title}
                </h4>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setLatestToast(null)}><X size={14} /></button>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.4' }}>{latestToast.message}</p>
            </div>
          </div>
        )}

        {/* Sidebar khóa cứng hiển thị vai trò */}
        <Sidebar 
          currentRole={currentRole} setSelectedProfile={setSelectedProfile}
          setEditMode={setEditMode} profiles={profiles} handleManualCountdown={handleManualCountdown}
        />

        {/* Bàn làm việc chính */}
        <main style={{ padding: '40px', overflowY: 'auto', height: '100vh', position: 'relative' }}>
          
          {/* --- KHU VỰC ĐẶT CHIẾC CHUÔNG THÔNG BÁO Ở GÓC TRÊN BÊN PHẢI --- */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', position: 'relative', zIndex: 9999 }}>
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

              {/* HỘP DANH SÁCH TẤT CẢ THÔNG BÁO (BẤM VÀO CHUÔNG MỚI HIỆN) */}
              {isBellOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setIsBellOpen(false)} />
                  <div className="glass-panel" style={{ position: 'absolute', top: '50px', right: '0', width: '380px', maxHeight: '480px', overflowY: 'auto', zIndex: 999, background: '#0b0f19', border: '1px solid var(--glass-border)', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--glass-border)' }}>
                      <h3 style={{ fontSize: '14px', margin: 0, color: 'white' }}>Tất cả thông báo ({notifications.length})</h3>
                      <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }} onClick={() => setIsBellOpen(false)}>Đóng</button>
                    </div>

                    {notifications.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>Không có thông báo nào cũ hơn.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[...notifications].sort((a, b) => b.timestamp - a.timestamp).map((n, i) => (
                          <div key={i} className="glass-panel" style={{ padding: '10px', fontSize: '13px', background: n.isRead ? 'rgba(255,255,255,0.01)' : 'rgba(99, 102, 241, 0.06)', borderColor: n.isRead ? 'var(--glass-border)' : 'var(--accent-primary)', opacity: n.isRead ? 0.65 : 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px' }}>
                              <h4 style={{ fontSize: '13px', fontWeight: n.isRead ? 'normal' : 'bold', color: n.isRead ? 'var(--text-secondary)' : 'white', margin: 0 }}>
                                {n.title}
                              </h4>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', shrink: 0 }}>
                                {/* Nút đánh dấu Đã đọc / Chưa đọc */}
                                <button 
                                  title={n.isRead ? "Đánh dấu Chưa đọc" : "Đánh dấu Đã đọc"} 
                                  style={{ background: 'none', border: 'none', color: n.isRead ? 'var(--text-muted)' : 'var(--success-color)', cursor: 'pointer', padding: 0 }} 
                                  onClick={() => handleToggleReadStatus(n.timestamp)}
                                >
                                  {n.isRead ? <EyeOff size={14} /> : <Check size={14} />}
                                </button>
                                {/* Nút Xóa thông báo */}
                                <button 
                                  title="Xóa thông báo" 
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
          </div>

          {/* Render các bàn làm việc theo phân quyền vai trò */}
          {currentRole === 'Role_Reservation' && (
            <PanelReservation 
              formData={formData} setFormData={setFormData} editMode={editMode} setEditMode={setEditMode}
              isSubmitting={isSubmitting} profiles={profiles} handleCreateProfile={handleCreateProfile}
              handleUpdateProfile={handleUpdateProfile} handleCancelProfile={handleCancelProfile}
            />
          )}

          {currentRole === 'Role_Admin_Logistics' && (
            <PanelCoordinator 
              profiles={profiles} selectedProfile={selectedProfile} setSelectedProfile={setSelectedProfile}
              flightOptions={flightOptions} setFlightOptions={setFlightOptions} selectedTravelOptions={selectedTravelOptions}
              venueKeyword={venueKeyword} setVenueKeyword={setVenueKeyword} suggestedVenues={suggestedVenues}
              selectedVenues={selectedVenues} selectedContracts={selectedContracts} negotiationNotes={negotiationNotes}
              setNegotiationNotes={setNegotiationNotes} ticketCodeInput={ticketCodeInput} setTicketCodeInput={setTicketCodeInput}
              actualAttendees={actualAttendees} setActualAttendees={setActualAttendees} hotelConfirmed={hotelConfirmed}
              setHotelConfirmed={setHotelConfirmed} isSubmitting={isSubmitting} handleSendExpertInvite={handleSendExpertInvite}
              handleSearchVenues={handleSearchVenues} handleBookVenue={handleBookVenue} handleProposeFlights={handleProposeFlights}
              handleAdminUploadRevision={handleAdminUploadRevision} handleApproveContract={handleApproveContract}
              handleBookFlightViaApi={handleBookFlightViaApi} handleUpdateTicket={handleUpdateTicket}
              handleFinalizeDocs={handleFinalizeDocs} handleCompleteLogistics={handleCompleteLogistics}
            />
          )}

          {currentRole === 'Role_Doc_Processor' && (
            <PanelDocProcessor 
              profiles={profiles} selectedProfile={selectedProfile} setSelectedProfile={setSelectedProfile}
              isSubmitting={isSubmitting} fetchProfiles={fetchProfiles}
            />
          )}
        </main>
      </div>
    );
  }

  return <div style={{ padding: '40px', textAlign: 'center' }}>Đang nạp cấu hình bảo mật...</div>;
}