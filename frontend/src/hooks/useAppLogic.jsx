import { useState, useEffect, useRef } from 'react';

export function useAppLogic() {
  // Global States
  const [currentRole, setCurrentRole] = useState('Role_Admin_Logistics');
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const selectedProfileRef = useRef(null);

  useEffect(() => {
    selectedProfileRef.current = selectedProfile;
  }, [selectedProfile]);

  const [notifications, setNotifications] = useState([]);
  const [editMode, setEditMode] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // External Portal states (Expert or Sales Manager)
  const [portalToken, setPortalToken] = useState(null);
  const [portalType, setPortalType] = useState(null);
  const [portalData, setPortalData] = useState(null);

  // Form States for BP Dat cho (Creation & Edit)
  const [formData, setFormData] = useState({
    seminarType: 'Hội thảo chuyên sâu về AI',
    expectedDate: '2026-06-15',
    city: 'Hanoi',
    expertName: 'Nguyễn Văn Chuyên Gia',
    expertEmail: 'expert@gmail.com',
    expertPhone: '0987654321',
    expertPassport: 'B1234567',
    expectedAttendees: 50
  });

  // Coordinator operational states
  const [venueKeyword, setVenueKeyword] = useState('');
  const [suggestedVenues, setSuggestedVenues] = useState([]);
  const [selectedContracts, setSelectedContracts] = useState([]);
  const [selectedVenues, setSelectedVenues] = useState([]);
  const [selectedTravelOptions, setSelectedTravelOptions] = useState([]);
  const [flightOptions, setFlightOptions] = useState([
    { flightDetails: 'VJ-123 (HN - SG), Khởi hành: 08:00 AM, Có xe đưa đón', estimatedCost: '2500000' },
    { flightDetails: 'VN-456 (HN - SG), Khởi hành: 10:30 AM, Có xe đưa đón', estimatedCost: '4200000' }
  ]);
  const [negotiationNotes, setNegotiationNotes] = useState('');
  const [actualAttendees, setActualAttendees] = useState('');
  const [hotelConfirmed, setHotelConfirmed] = useState(false);
  const [ticketCodeInput, setTicketCodeInput] = useState('');
  
  // External input states
  const [expertScheduleInput, setExpertScheduleInput] = useState('');
  const [expertConfirmedDate, setExpertConfirmedDate] = useState('');
  const [expertRejectReason, setExpertRejectReason] = useState('');
  const [salesRejectReason, setSalesRejectReason] = useState('');

  // Fetch initial profile list
  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/seminars');
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
        const currentSelected = selectedProfileRef.current;
        if (currentSelected) {
          const updated = data.find(p => p.id === currentSelected.id);
          if (updated) {
            setSelectedProfile(updated);
            fetchLogisticsData(updated.id);
          }
        }
      }
    } catch (e) {
      console.error('Error loading profiles: ', e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.map(n => ({
          title: n.title,
          message: n.message,
          type: n.type,
          timestamp: n.createdAt
        })));
      }
    } catch (e) {
      console.error('Error loading notifications: ', e);
    }
  };

  const fetchLogisticsData = async (profileId) => {
    if (!profileId) return;
    try {
      // 1. Đổi tên biến thành resVenues để không trùng lặp
      const resVenues = await fetch(`/api/seminars/${profileId}/venues`);
      if (resVenues.ok) {
        const dataV = await resVenues.json();
        const mappedVenues = dataV.map(item => ({
          id: item.id,
          venueName: item.venueName || "Khách sạn đối tác",
          salesToken: item.salesToken,
          status: item.status
        }));
        setSelectedVenues(mappedVenues);
      }
      
      // 2. Đổi tên biến thành resContracts để tránh lỗi biên dịch khai báo lại
      const resContracts = await fetch(`/api/seminars/${profileId}/contracts`);
      if (resContracts.ok) {
        const dataC = await resContracts.json();
        setSelectedContracts(dataC);
      }
      
      // 3. Đổi tên biến thành resTravel cho đồng bộ cấu trúc sạch sẽ
      const resTravel = await fetch(`/api/seminars/${profileId}/travel`);
      if (resTravel.ok) {
        const dataT = await resTravel.json();
        setSelectedTravelOptions(dataT);
      }
    } catch (e) {
      console.error('Error loading logistics data: ', e);
    }
  };

  useEffect(() => {
    if (selectedProfile) {
      fetchLogisticsData(selectedProfile.id);
      setVenueKeyword(selectedProfile.city);
      handleSearchVenues(selectedProfile.city, selectedProfile.expectedAttendees);
    } else {
      setSelectedVenues([]);
      setSelectedContracts([]);
      setSelectedTravelOptions([]);
      setSuggestedVenues([]);
      setVenueKeyword('');
    }
  }, [selectedProfile]);

  // Setup Server-Sent Events (SSE) for Real-time warnings/alerts
  useEffect(() => {
    const eventSource = new EventSource('/api/notifications/subscribe');
    eventSource.addEventListener('INIT', (e) => {
      console.log('SSE Stream: ', e.data);
    });

    eventSource.addEventListener('NOTIFICATION', (e) => {
      const notif = JSON.parse(e.data);
      setNotifications(prev => [notif, ...prev]);
      fetchProfiles();
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (token) {
        loadPortalData(token);
      }
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.timestamp !== notif.timestamp));
      }, 6000);
    });

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setPortalToken(token);
      loadPortalData(token);
    } else {
      fetchProfiles();
    }
    fetchNotifications();

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (!portalToken) return;
    const intervalId = setInterval(() => {
      loadPortalData(portalToken);
    }, 4000);
    return () => clearInterval(intervalId);
  }, [portalToken]);

  const loadPortalData = async (token) => {
    try {
      let res = await fetch(`/api/external/expert?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setPortalType('expert');
        setPortalData(data);
        setExpertConfirmedDate(data.expectedDate);
        return;
      }
    } catch (e) {}

    try {
      let res = await fetch(`/api/external/sales?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setPortalType('sales');
        setPortalData(data);
        return;
      }
    } catch (e) {}
  };

  // Reservation handlers
  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/seminars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Role': currentRole },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
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
        fetchProfiles();
      } else {
        const err = await res.text();
        alert('Lỗi khởi tạo: ' + err);
      }
    } catch (err) {
      alert('Error: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e, id) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Role': currentRole },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setEditMode(null);
        fetchProfiles();
      } else {
        const err = await res.text();
        alert('Lỗi cập nhật: ' + err);
      }
    } catch (err) {
      alert('Error: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelProfile = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy hồ sơ này?')) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${id}/cancel`, { method: 'POST', headers: { 'X-Role': currentRole } });
      if (res.ok) {
        fetchProfiles();
      } else {
        const err = await res.text();
        alert(err);
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Coordinator / external handlers
  const handleSendExpertInvite = async (id) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${id}/invite`, { method: 'POST' });
      if (res.ok) {
        alert('Đã gửi đường link Token mã hóa qua email cho Chuyên gia!');
        fetchProfiles();
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchVenues = async (city, capacity) => {
    try {
      const res = await fetch(`/api/venues/suggest?city=${city}&capacity=${capacity}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestedVenues(data);
      }
    } catch (e) {
      alert(e);
    }
  };

  const handleBookVenue = async (profileId, venueId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${profileId}/book?venueId=${venueId}`, { method: 'POST', headers: { 'X-Role': currentRole } });
      if (res.ok) {
        const savedData = await res.json();
        alert('Đã gửi yêu cầu đặt phòng kèm dự toán PDF cho Sales Manager của Khách sạn!');
        
        if (savedData) {
          setSelectedVenues([{
            id: savedData.id,
            venueName: savedData.venue?.name || "Khách sạn đối tác",
            salesToken: savedData.salesToken,
            status: savedData.status || "PENDING"
          }]);
        }
        await fetchProfiles();
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveContract = async (profileId) => {
    if (!window.confirm('Bạn có chắc chắn phê duyệt bản hợp đồng cuối cùng?')) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${profileId}/approve-contract`, { method: 'POST', headers: { 'X-Role': currentRole } });
      if (res.ok) {
        alert('Đã phê duyệt hợp đồng! Địa điểm được khóa chính thức và bản chốt được gửi tự động cho Sales Manager.');
        fetchProfiles();
        fetchLogisticsData(profileId);
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveContractDirectly = async (profileId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${profileId}/approve-contract`, { method: 'POST', headers: { 'X-Role': currentRole } });
      if (res.ok) {
        fetchProfiles();
        fetchLogisticsData(profileId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualCountdown = async () => {
    try {
      const res = await fetch('/api/seminars/check-countdown', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          alert(`Đã phát hiện và kích hoạt cảnh báo 14 ngày cho ${data.length} hồ sơ!`);
        } else {
          alert('Không có hồ sơ nào có ngày tổ chức đúng hạn 14 ngày đếm ngược.');
        }
        fetchProfiles();
      }
    } catch (e) {
      alert(e);
    }
  };

  const handleProposeFlights = async (profileId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${profileId}/travel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Role': currentRole },
        body: JSON.stringify(flightOptions)
      });
      if (res.ok) {
        alert('Đã gửi 2 phương án vé máy bay đề xuất cho Chuyên gia lựa chọn!');
        fetchProfiles();
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTicket = async (profileId) => {
    if (!ticketCodeInput) return alert('Vui lòng nhập Mã vé máy bay!');
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${profileId}/ticket?ticketCode=${ticketCodeInput}`, { method: 'POST', headers: { 'X-Role': currentRole } });
      if (res.ok) {
        alert('Đã chốt mã vé và gửi lộ trình di chuyển chính thức cho Chuyên gia!');
        setTicketCodeInput('');
        fetchProfiles();
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookFlightViaApi = async (profileId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${profileId}/book-flight-api`, { method: 'POST', headers: { 'X-Role': currentRole } });
      if (res.ok) {
        alert('Đồng bộ và gọi API Hãng hàng không đặt vé thành công! Vé máy bay điện tử đã được xuất và gửi tự động.');
        fetchProfiles();
      } else {
        const err = await res.text();
        alert('Lỗi gọi API đặt vé: ' + err);
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalizeDocs = async (profileId) => {
    if (!actualAttendees) return alert('Vui lòng nhập số đại biểu thực tế!');
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${profileId}/finalize-docs?actualAttendees=${actualAttendees}`, { method: 'POST', headers: { 'X-Role': currentRole } });
      if (res.ok) {
        const data = await res.json();
        alert(`Đã xuất Phiếu PDF: Sách: ${data.books}, Tờ rơi: ${data.brochures}, Thẻ tên: ${data.nametags}. Đã gửi lệnh hỏa tốc đến BP Xử lý tài liệu!`);
        fetchProfiles();
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteLogistics = async (profileId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${profileId}/complete?hotelConfirmed=${hotelConfirmed}`, { method: 'POST', headers: { 'X-Role': currentRole } });
      if (res.ok) {
        alert('Quy trình chuẩn bị hoàn tất. Trạng thái chuyển sang [Sẵn sàng tổ chức]!');
        fetchProfiles();
      } else {
        const err = await res.text();
        alert(err);
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // External Portal Actions
  const handleExpertAccept = async (e) => {
    e.preventDefault();
    if (!expertScheduleInput) return alert('Vui lòng nhập Lịch trình mong muốn!');
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/external/expert/accept?token=${portalToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ desiredSchedule: expertScheduleInput, confirmedDate: expertConfirmedDate })
      });
      if (res.ok) {
        alert('Bạn đã xác nhận tham gia thành công. Chúc mừng!');
        loadPortalData(portalToken);
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpertReject = async (e) => {
    e.preventDefault();
    if (!expertRejectReason) return alert('Vui lòng nhập lý do từ chối!');
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/external/expert/reject?token=${portalToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: expertRejectReason })
      });
      if (res.ok) {
        alert('Bạn đã gửi phản hồi từ chối tổ chức hội thảo thành công.');
        loadPortalData(portalToken);
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpertChooseFlight = async (optionId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/external/expert/choose-flight?token=${portalToken}&optionId=${optionId}`, { method: 'POST' });
      if (res.ok) {
        alert('Bạn đã chọn phương án di chuyển thành công! Vé máy bay sẽ gửi qua Email cho bạn.');
        loadPortalData(portalToken);
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSalesRespond = async (e, agree) => {
    e.preventDefault();
    const formDataUpload = new FormData();
    formDataUpload.append('agree', agree);
    if (!agree) {
      if (!salesRejectReason) return alert('Vui lòng nhập lý do từ chối!');
      formDataUpload.append('reason', salesRejectReason);
    } else {
      const fileInput = document.getElementById('contract-draft');
      if (!fileInput.files[0]) return alert('Vui lòng đính kèm bản nháp Hợp đồng!');
      if (fileInput.files[0].size === 0) return alert('Tệp tin tải lên bị rỗng (0 bytes)!');
      formDataUpload.append('file', fileInput.files[0]);
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/external/sales/respond?token=${portalToken}`, { method: 'POST', body: formDataUpload });
      if (res.ok) {
        alert('Đã phản hồi yêu cầu đặt phòng thành công!');
        loadPortalData(portalToken);
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSalesUploadRevision = async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('contract-revision-file');
    if (!fileInput.files[0]) return alert('Vui lòng chọn tệp hợp đồng sửa đổi!');
    if (fileInput.files[0].size === 0) return alert('Tệp tin tải lên bị rỗng (0 bytes)!');
    const formDataUpload = new FormData();
    formDataUpload.append('file', fileInput.files[0]);
    formDataUpload.append('notes', negotiationNotes || 'Bản sửa đổi hợp đồng kinh tế.');
    formDataUpload.append('uploadedBy', 'SALES');

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/external/sales/contract/revision?token=${portalToken}`, { method: 'POST', body: formDataUpload });
      if (res.ok) {
        alert('Đã gửi bản hợp đồng sửa đổi thành công!');
        setNegotiationNotes('');
        loadPortalData(portalToken);
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSalesConfirmDelivery = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/external/sales/confirm-delivery?token=${portalToken}`, { method: 'POST' });
      if (res.ok) {
        alert('Xác nhận đã nhận đủ tài liệu thành công với Ban điều phối!');
        loadPortalData(portalToken);
      } else {
        const txt = await res.text();
        alert(txt);
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminUploadRevision = async (e, profileId) => {
    e.preventDefault();
    const fileInput = document.getElementById('admin-contract-revision-file');
    if (!fileInput.files[0]) return alert('Vui lòng chọn tệp hợp đồng sửa đổi!');
    if (fileInput.files[0].size === 0) return alert('Tệp tin tải lên bị rỗng (0 bytes)!');
    const formDataUpload = new FormData();
    formDataUpload.append('file', fileInput.files[0]);

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res2 = await fetch(`/api/seminars/${profileId}/contract/revision?notes=${negotiationNotes}`, { method: 'POST', headers: { 'X-Role': currentRole }, body: formDataUpload });
      if (res2.ok) {
        alert('Đã gửi yêu cầu điều chỉnh hợp đồng cho Khách sạn!');
        setNegotiationNotes('');
        fetchProfiles();
        fetchLogisticsData(profileId);
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    currentRole,
    setCurrentRole,
    profiles,
    selectedProfile,
    setSelectedProfile,
    notifications,
    editMode,
    setEditMode,
    isSubmitting,
    portalToken,
    setPortalToken,
    portalType,
    portalData,
    formData,
    setFormData,
    venueKeyword,
    setVenueKeyword,
    suggestedVenues,
    selectedContracts,
    selectedVenues,
    selectedTravelOptions,
    flightOptions,
    setFlightOptions,
    negotiationNotes,
    setNegotiationNotes,
    actualAttendees,
    setActualAttendees,
    hotelConfirmed,
    setHotelConfirmed,
    ticketCodeInput,
    setTicketCodeInput,
    expertScheduleInput,
    setExpertScheduleInput,
    expertConfirmedDate,
    setExpertConfirmedDate,
    expertRejectReason,
    setExpertRejectReason,
    salesRejectReason,
    setSalesRejectReason,
    fetchProfiles,
    fetchNotifications,
    fetchLogisticsData,
    loadPortalData,
    handleCreateProfile,
    handleUpdateProfile,
    handleCancelProfile,
    handleSendExpertInvite,
    handleSearchVenues,
    handleBookVenue,
    handleApproveContract,
    handleApproveContractDirectly,
    handleProposeFlights,
    handleUpdateTicket,
    handleBookFlightViaApi,
    handleFinalizeDocs,
    handleCompleteLogistics,
    handleExpertAccept,
    handleExpertReject,
    handleExpertChooseFlight,
    handleSalesRespond,
    handleSalesUploadRevision,
    handleSalesConfirmDelivery,
    handleAdminUploadRevision,
    handleManualCountdown,
    setNotifications
  };
}

export default useAppLogic;