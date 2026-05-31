import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

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
    handleAdminUploadRevision, handleManualCountdown, setNotifications, fetchProfiles
  } = logic;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  // Ép đồng bộ vai trò của Session người dùng vào biến trạng thái hệ thống ngay khi đăng nhập thành công
  const handleLoginSuccess = (userInfo) => {
    setIsAuthenticated(true);
    setAuthUser(userInfo);
    if (userInfo && userInfo.role) {
      setCurrentRole(userInfo.role); // Gán cứng vai trò từ DB trả về, chặn việc useAppLogic dùng Role mặc định
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
          portalData={portalData} salesRejectReason={logic.salesRejectReason} setSalesRejectReason={logic.setSalesRejectReason}
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
        {/* Real-time Toast Push Panels */}
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '10px', width: '350px' }}>
          {notifications.map((n, i) => (
            <div key={i} className={`glass-panel slide-in ${n.type === 'REJECT' || n.title.includes('CẢNH BÁO') ? 'pulse-alert-red' : ''}`} style={{ background: n.type === 'REJECT' || n.title.includes('CẢNH BÁO') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(17, 24, 39, 0.95)', borderLeft: `4px solid ${n.type === 'SUCCESS' ? 'var(--success-color)' : n.type === 'REJECT' ? 'var(--danger-color)' : 'var(--accent-primary)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  {n.type === 'SUCCESS' ? <CheckCircle size={16} color="var(--success-color)" /> : <AlertTriangle size={16} color={n.type === 'REJECT' ? 'var(--danger-color)' : 'var(--warning-color)'} />}
                  {n.title}
                </h4>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setNotifications(prev => prev.filter(item => item.timestamp !== n.timestamp))}><X size={14} /></button>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.4' }}>{n.message}</p>
            </div>
          ))}
        </div>

        {/* Sidebar khóa cứng hiển thị vai trò */}
        <Sidebar 
          currentRole={currentRole} setSelectedProfile={setSelectedProfile}
          setEditMode={setEditMode} profiles={profiles} handleManualCountdown={handleManualCountdown}
        />

        {/* Bàn làm việc kiểm tra chặt chẽ, chỉ mở đúng Panel tương ứng quyền sở hữu */}
        <main style={{ padding: '40px', overflowY: 'auto', height: '100vh' }}>
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