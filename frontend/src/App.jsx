import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, List, Bell, Users, MapPin, Calendar, FileText, Plane, ShieldCheck, 
  Send, X, Edit2, AlertTriangle, CheckCircle, Search, FileUp, Download, Eye, Check,
  LogOut, LockKeyhole, ClipboardList
} from 'lucide-react';

const ROLE_META = {
  Role_Reservation: { label: 'BP Đặt chỗ', badge: 'badge-new', panel: 'Tiếp nhận & Khởi tạo hồ sơ' },
  Role_Admin_Logistics: { label: 'Điều phối viên', badge: 'badge-logistics', panel: 'Điều phối hậu cần' },
  Role_Doc_Processor: { label: 'BP Xử lý tài liệu', badge: 'badge-success', panel: 'Xử lý & chuẩn bị tài liệu' }
};

const DEMO_USERS = [
  { username: 'reservation', password: '123456', name: 'Nhân viên đặt chỗ', role: 'Role_Reservation' },
  { username: 'admin', password: '123456', name: 'Điều phối viên hậu cần', role: 'Role_Admin_Logistics' },
  { username: 'document', password: '123456', name: 'Nhân viên tài liệu', role: 'Role_Doc_Processor' }
];

const ROLE_NAV_ITEMS = [
  { role: 'Role_Reservation', label: 'BP Đặt chỗ Panel', icon: Plus },
  { role: 'Role_Admin_Logistics', label: 'Điều phối viên Panel', icon: List },
  { role: 'Role_Doc_Processor', label: 'BP Xử lý tài liệu Panel', icon: FileText }
];

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('seminarHubUser');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export default function App() {
  // Global States
  const [currentUser, setCurrentUser] = useState(getStoredUser);
  const [currentRole, setCurrentRole] = useState(() => getStoredUser()?.role || null);
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: '123456' });
  const [loginError, setLoginError] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const selectedProfileRef = useRef(null);
  useEffect(() => {
    selectedProfileRef.current = selectedProfile;
  }, [selectedProfile]);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [editMode, setEditMode] = useState(null); // id of profile being edited by BP Dat cho
  const [isSubmitting, setIsSubmitting] = useState(false);

  // External Portal states (Expert or Sales Manager)
  const [portalToken, setPortalToken] = useState(null);
  const [portalType, setPortalType] = useState(null); // 'expert' or 'sales'
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
  const [choosingFlightOptionId, setChoosingFlightOptionId] = useState(null);

  // Fetch initial profile list
  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/seminars');
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
        // Sync selected profile details if open
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
      console.error("Error loading profiles: ", e);
    }
  };

  const fetchNotifications = async () => {
    if (!currentRole) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'X-Role': currentRole }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          targetRole: n.targetRole || 'ALL',
          relatedProfileId: n.relatedProfileId,
          taskStatus: n.taskStatus || 'OPEN',
          readAt: n.readAt,
          timestamp: n.createdAt
        })));
      }
    } catch (e) {
      console.error("Error loading notifications: ", e);
    }
  };

  const fetchLogisticsData = async (profileId) => {
    if (!profileId) return;
    try {
      const resV = await fetch(`/api/seminars/${profileId}/venues`);
      if (resV.ok) {
        const dataV = await resV.json();
        setSelectedVenues(dataV);
      }
      const resC = await fetch(`/api/seminars/${profileId}/contracts`);
      if (resC.ok) {
        const dataC = await resC.json();
        setSelectedContracts(dataC);
      }
      const resT = await fetch(`/api/seminars/${profileId}/travel`);
      if (resT.ok) {
        const dataT = await resT.json();
        setSelectedTravelOptions(dataT);
      }
    } catch (e) {
      console.error("Error loading logistics data: ", e);
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
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setPortalToken(token);
      loadPortalData(token);
      return;
    }

    if (!currentRole) return;

    const eventSource = new EventSource(`/api/notifications/subscribe?role=${encodeURIComponent(currentRole)}`);
    
    eventSource.addEventListener('INIT', (e) => {
      console.log("SSE Stream: ", e.data);
    });

    eventSource.addEventListener('NOTIFICATION', (e) => {
      const notif = JSON.parse(e.data);
      setNotifications(prev => [notif, ...prev.filter(item => item.id !== notif.id)]);
      
      // Auto reload lists
      fetchProfiles();
      
      // Auto reload external portal if token is present in URL
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (token) {
        loadPortalData(token);
      }
    });

    fetchProfiles();
    fetchNotifications();

    return () => {
      eventSource.close();
    };
  }, [currentRole]);

  // Periodic polling for token-based external portals to ensure seamless auto-refresh
  useEffect(() => {
    if (!portalToken) return;
    const intervalId = setInterval(() => {
      loadPortalData(portalToken);
    }, 4000);
    return () => clearInterval(intervalId);
  }, [portalToken]);

  // Load token validated portals
  const loadPortalData = async (token) => {
    // Try Expert Portal
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

    // Try Sales Portal
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

  // F1.1 - BP Dat cho creates profile
  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/seminars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Role': currentRole
        },
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
        alert("Lỗi khởi tạo: " + err);
      }
    } catch (err) {
      alert("Error: " + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // F1.1 - Update Profile (RBAC enforced on backend)
  const handleUpdateProfile = async (e, id) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Role': currentRole
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setEditMode(null);
        fetchProfiles();
      } else {
        const err = await res.text();
        alert("Lỗi cập nhật: " + err);
      }
    } catch (err) {
      alert("Error: " + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Soft cancel request
  const handleCancelProfile = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy hồ sơ này?")) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${id}/cancel`, {
        method: 'POST',
        headers: { 'X-Role': currentRole }
      });
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

  // F2.1 - Coordinator sends expert email invitation link
  const handleSendExpertInvite = async (id) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${id}/invite`, {
        method: 'POST',
        headers: { 'X-Role': currentRole }
      });
      if (res.ok) {
        alert("Đã gửi đường link Token mã hóa qua email cho Chuyên gia!");
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

  // F3.2 - Coordinator queries suggested hotels
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

  // F3.3 - Coordinator requests booking
  const handleBookVenue = async (profileId, venueId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${profileId}/book?venueId=${venueId}`, {
        method: 'POST',
        headers: { 'X-Role': currentRole }
      });
      if (res.ok) {
        alert("Đã gửi yêu cầu đặt phòng kèm dự toán PDF cho Sales Manager của Khách sạn!");
        fetchProfiles();
        fetchLogisticsData(profileId);
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // F3.5 - Coordinator approves latest contract
  const handleApproveContract = async (profileId) => {
    if (!window.confirm("Bạn có chắc chắn phê duyệt bản hợp đồng cuối cùng?")) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${profileId}/approve-contract`, {
        method: 'POST',
        headers: { 'X-Role': currentRole }
      });
      if (res.ok) {
        alert("Đã phê duyệt hợp đồng! Địa điểm được khóa chính thức và bản chốt được gửi tự động cho Sales Manager.");
        fetchProfiles();
        fetchLogisticsData(profileId);
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // F4.1 - Propose Flights
  const handleProposeFlights = async (profileId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${profileId}/travel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Role': currentRole
        },
        body: JSON.stringify(flightOptions)
      });
      if (res.ok) {
        alert("Đã gửi 2 phương án vé máy bay đề xuất cho Chuyên gia lựa chọn!");
        fetchProfiles();
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // F4.3 - Update flight code
  const handleUpdateTicket = async (profileId) => {
    if (!ticketCodeInput) return alert("Vui lòng nhập Mã vé máy bay!");
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${profileId}/ticket?ticketCode=${ticketCodeInput}`, {
        method: 'POST',
        headers: { 'X-Role': currentRole }
      });
      if (res.ok) {
        alert("Đã chốt mã vé và gửi lộ trình di chuyển chính thức cho Chuyên gia!");
        setTicketCodeInput('');
        fetchProfiles();
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // F4.2 & F4.3 - Simulated flight API booking
  const handleBookFlightViaApi = async (profileId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${profileId}/book-flight-api`, {
        method: 'POST',
        headers: { 'X-Role': currentRole }
      });
      if (res.ok) {
        alert("Đồng bộ và gọi API Hãng hàng không đặt vé thành công! Vé máy bay điện tử đã được xuất và gửi tự động.");
        fetchProfiles();
      } else {
        const err = await res.text();
        alert("Lỗi gọi API đặt vé: " + err);
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // F5.2 & F5.3 - Calculate and packaging slip PDF
  const handleFinalizeDocs = async (profileId) => {
    if (!actualAttendees) return alert("Vui lòng nhập số đại biểu thực tế!");
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${profileId}/finalize-docs?actualAttendees=${actualAttendees}`, {
        method: 'POST',
        headers: { 'X-Role': currentRole }
      });
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

  // F5.4 - Complete workflow
  const handleCompleteLogistics = async (profileId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/seminars/${profileId}/complete?hotelConfirmed=${hotelConfirmed}`, {
        method: 'POST',
        headers: { 'X-Role': currentRole }
      });
      if (res.ok) {
        alert("Quy trình chuẩn bị hoàn tất. Trạng thái chuyển sang [Sẵn sàng tổ chức]!");
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

  // External Portal Actions: Expert accept
  const handleExpertAccept = async (e) => {
    e.preventDefault();
    if (!expertScheduleInput) return alert("Vui lòng nhập Lịch trình mong muốn!");
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/external/expert/accept?token=${portalToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          desiredSchedule: expertScheduleInput,
          confirmedDate: expertConfirmedDate
        })
      });
      if (res.ok) {
        alert("Bạn đã xác nhận tham gia thành công. Chúc mừng!");
        loadPortalData(portalToken);
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // External Portal Actions: Expert reject
  const handleExpertReject = async (e) => {
    e.preventDefault();
    if (!expertRejectReason) return alert("Vui lòng nhập lý do từ chối!");
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/external/expert/reject?token=${portalToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: expertRejectReason })
      });
      if (res.ok) {
        alert("Bạn đã gửi phản hồi từ chối tổ chức hội thảo thành công.");
        loadPortalData(portalToken);
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // External Portal Actions: Expert chooses travel flight option
  const handleExpertChooseFlight = async (optionId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setChoosingFlightOptionId(optionId);
    try {
      const res = await fetch(`/api/external/expert/choose-flight?token=${portalToken}&optionId=${optionId}`, {
        method: 'POST'
      });
      if (res.ok) {
        alert("Bạn đã chọn phương án di chuyển thành công! Vé máy bay sẽ gửi qua Email cho bạn.");
        loadPortalData(portalToken);
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
      setChoosingFlightOptionId(null);
    }
  };

  // External Portal Actions: Sales Respond (Agree/Disagree)
  const handleSalesRespond = async (e, agree) => {
    e.preventDefault();
    const formDataUpload = new FormData();
    formDataUpload.append('agree', agree);
    if (!agree) {
      if (!salesRejectReason) return alert("Vui lòng nhập lý do từ chối!");
      formDataUpload.append('reason', salesRejectReason);
    } else {
      const fileInput = document.getElementById('contract-draft');
      if (!fileInput.files[0]) return alert("Vui lòng đính kèm bản nháp Hợp đồng!");
      if (fileInput.files[0].size === 0) return alert("Tệp tin tải lên bị rỗng (0 bytes)!");
      formDataUpload.append('file', fileInput.files[0]);
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/external/sales/respond?token=${portalToken}`, {
        method: 'POST',
        body: formDataUpload
      });
      if (res.ok) {
        alert("Đã phản hồi yêu cầu đặt phòng thành công!");
        loadPortalData(portalToken);
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // External Portal Actions: Sales uploads a revision draft
  const handleSalesUploadRevision = async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('contract-revision-file');
    if (!fileInput.files[0]) return alert("Vui lòng chọn tệp hợp đồng sửa đổi!");
    if (fileInput.files[0].size === 0) return alert("Tệp tin tải lên bị rỗng (0 bytes)!");
    
    const formDataUpload = new FormData();
    formDataUpload.append('file', fileInput.files[0]);
    formDataUpload.append('notes', negotiationNotes || "Bản sửa đổi hợp đồng kinh tế.");
    formDataUpload.append('uploadedBy', "SALES");

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/external/sales/contract/revision?token=${portalToken}`, {
        method: 'POST',
        body: formDataUpload
      });
      if (res.ok) {
        alert("Đã gửi bản hợp đồng sửa đổi thành công!");
        setNegotiationNotes('');
        loadPortalData(portalToken);
      }
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // External Portal Actions: Sales confirms delivery of documents
  const handleSalesConfirmDelivery = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/external/sales/confirm-delivery?token=${portalToken}`, {
        method: 'POST'
      });
      if (res.ok) {
        alert("Xác nhận đã nhận đủ tài liệu thành công với Ban điều phối!");
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

  // Admin uploads revised contract
  const handleAdminUploadRevision = async (e, profileId) => {
    e.preventDefault();
    const fileInput = document.getElementById('admin-contract-revision-file');
    if (!fileInput.files[0]) return alert("Vui lòng chọn tệp hợp đồng sửa đổi!");
    if (fileInput.files[0].size === 0) return alert("Tệp tin tải lên bị rỗng (0 bytes)!");
    
    const formDataUpload = new FormData();
    formDataUpload.append('file', fileInput.files[0]);
    formDataUpload.append('notes', negotiationNotes || "Ý kiến chỉnh sửa từ Điều phối viên.");

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Actually standard multipart upload:
      const res2 = await fetch(`/api/seminars/${profileId}/contract/revision?notes=${negotiationNotes}`, {
        method: 'POST',
        headers: { 'X-Role': currentRole },
        body: formDataUpload
      });

      if (res2.ok) {
        alert("Đã gửi yêu cầu điều chỉnh hợp đồng cho Khách sạn!");
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

  // Trigger manual 14 day warning countdown check (demo)
  const handleManualCountdown = async () => {
    try {
      const res = await fetch('/api/seminars/check-countdown', {
        method: 'POST',
        headers: { 'X-Role': currentRole }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          alert(`Đã phát hiện và kích hoạt cảnh báo 14 ngày cho ${data.length} hồ sơ!`);
        } else {
          alert("Không có hồ sơ nào có ngày tổ chức đúng hạn 14 ngày đếm ngược.");
        }
        fetchProfiles();
      } else {
        const err = await res.text();
        alert(err);
      }
    } catch (e) {
      alert(e);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const user = DEMO_USERS.find(item =>
      item.username === loginForm.username.trim() && item.password === loginForm.password
    );
    if (!user) {
      setLoginError('Sai tài khoản hoặc mật khẩu demo.');
      return;
    }
    const sessionUser = { username: user.username, name: user.name, role: user.role };
    localStorage.setItem('seminarHubUser', JSON.stringify(sessionUser));
    setCurrentUser(sessionUser);
    setCurrentRole(sessionUser.role);
    setSelectedProfile(null);
    setEditMode(null);
    setLoginError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('seminarHubUser');
    setCurrentUser(null);
    setCurrentRole(null);
    setSelectedProfile(null);
    setNotifications([]);
    setIsNotificationPanelOpen(false);
    setProfiles([]);
    setEditMode(null);
  };

  const updateNotificationState = (id, patch) => {
    setNotifications(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
  };

  const handleReadNotification = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'X-Role': currentRole }
      });
      if (res.ok) {
        const updated = await res.json();
        updateNotificationState(id, { readAt: updated.readAt });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDoneNotification = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}/done`, {
        method: 'POST',
        headers: { 'X-Role': currentRole }
      });
      if (res.ok) {
        const updated = await res.json();
        updateNotificationState(id, { readAt: updated.readAt, taskStatus: updated.taskStatus });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // RENDER EXTERNAL PORTALS IF VALID TOKEN PRESENT
  if (portalToken && portalType) {
    if (portalType === 'expert') {
      const p = portalData;
      return (
        <div style={{ padding: '40px max(20px, (100% - 800px)/2)', minHeight: '100vh' }}>
          <header style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 className="text-gradient" style={{ fontSize: '28px', fontWeight: '800' }}>CỔNG THÔNG TIN CHUYÊN GIA</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Chốt sự tham gia & Phương án vé máy bay</p>
          </header>

          {p && (
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

              {/* State handling based on status */}
              {p.status === 'Mới tạo / Chờ xử lý' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <form onSubmit={handleExpertAccept} className="glass-panel" style={{ background: 'rgba(16, 185, 129, 0.03)' }}>
                    <h3 style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                      <CheckCircle size={20} /> Đồng ý Tham gia
                    </h3>
                    <div className="form-group">
                      <label className="form-label">Ngày tổ chức hội thảo chính thức (Cố định) *</label>
                      <input 
                        type="text"
                        className="form-input"
                        value={p.expectedDate}
                        disabled
                        readOnly
                      />
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

              {/* F4.1 - Travel choice display */}
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
                      const isChoosingThisOption = choosingFlightOptionId === opt.id;
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
                            <button className="btn btn-primary" disabled={isSubmitting} onClick={() => handleExpertChooseFlight(opt.id)}>
                              {isChoosingThisOption ? "Đang chọn..." : "Chọn Phương án này"}
                            </button>
                          ) : (
                            <span className={`status-badge ${isSelected ? 'badge-success' : 'badge-muted'}`}>{isSelected ? 'Đã chọn' : 'Không chọn'}</span>
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
          )}
        </div>
      );
    }

    if (portalType === 'sales') {
      const sv = portalData;
      return (
        <div style={{ padding: '40px max(20px, (100% - 900px)/2)', minHeight: '100vh' }}>
          <header style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 className="text-gradient" style={{ fontSize: '28px', fontWeight: '800' }}>CỔNG ĐÀM PHÁN HOTEL SALES MANAGER</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Xử lý đặt phòng & Thương thảo hợp đồng</p>
          </header>

          {sv && (
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

              {/* F3.4 - Booking proposal accept/reject */}
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

              {/* F3.4 Contract version list and negotiation logs */}
              {sv.status !== 'PENDING' && sv.status !== 'REJECTED' && (
                <div className="glass-panel" style={{ background: 'rgba(255, 255, 255, 0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3>Đàm phán Lịch sử phiên bản hợp đồng</h3>
                    <span className={`status-badge ${sv.status === 'SELECTED' ? 'badge-success' : 'badge-logistics'}`}>
                      {sv.status === 'SELECTED' ? 'Hoàn tất đàm phán' : 'Đang đàm phán'} ({sv.status})
                    </span>
                  </div>

                  {/* List previous files */}
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
                        {/* Decrypted download button */}
                        <a href={`/api/external/contract/${c.id}/download`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                          <Download size={14} /> Tải xuống
                        </a>
                      </div>
                    ))}
                  </div>

                  {/* Upload new revision */}
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
          )}
        </div>
      );
    }
  }

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
        <form onSubmit={handleLogin} className="glass-panel" style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'var(--accent-gradient)', display: 'grid', placeItems: 'center' }}>
              <LockKeyhole size={22} />
            </div>
            <div>
              <h1 className="text-gradient" style={{ fontSize: '24px', lineHeight: 1.1 }}>SEMINAR HUB</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>Đăng nhập để vào đúng phân hệ được phân quyền</p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tài khoản</label>
            <input
              className="form-input"
              value={loginForm.username}
              onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              className="form-input"
              value={loginForm.password}
              onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
              autoComplete="current-password"
            />
          </div>

          {loginError && (
            <div style={{ color: 'var(--danger-color)', fontSize: '13px', marginBottom: '16px' }}>{loginError}</div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '18px' }}>
            <ShieldCheck size={16} /> Đăng nhập
          </button>

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '14px' }}>
            <h5 style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '10px' }}>Tài khoản demo</h5>
            <div style={{ display: 'grid', gap: '8px' }}>
              {DEMO_USERS.map(user => (
                <button
                  key={user.username}
                  type="button"
                  className="btn btn-secondary"
                  style={{ justifyContent: 'space-between', width: '100%', fontSize: '12px', padding: '8px 10px' }}
                  onClick={() => setLoginForm({ username: user.username, password: user.password })}
                >
                  <span>{user.username} / {user.password}</span>
                  <span className={`status-badge ${ROLE_META[user.role].badge}`}>{ROLE_META[user.role].label}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    );
  }

  // RENDER INTERNAL HUB DASHBOARD
  const openTasks = notifications.filter(n => n.taskStatus !== 'DONE');
  const unreadTaskCount = openTasks.filter(n => !n.readAt).length;
  const notificationCountLabel = unreadTaskCount > 0 ? unreadTaskCount : openTasks.length;
  const formatNotificationTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-grid">
      {isNotificationPanelOpen && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          width: 'min(430px, calc(100vw - 40px))',
          maxHeight: 'calc(100vh - 40px)'
        }}>
          <div className="glass-panel slide-in" style={{ background: 'rgba(17, 24, 39, 0.98)', padding: '18px', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                  <Bell size={18} /> Thông báo
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
                  {ROLE_META[currentRole]?.label} - {openTasks.length} task mở
                </p>
              </div>
              <button className="btn btn-secondary" style={{ width: '36px', height: '36px', padding: 0 }} onClick={() => setIsNotificationPanelOpen(false)}>
                <X size={16} />
              </button>
            </div>

            {notifications.length === 0 ? (
              <div style={{ padding: '34px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <ClipboardList size={32} style={{ marginBottom: '10px', opacity: 0.65 }} />
                <div>Chưa có thông báo nào cho vai trò này.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notifications.map((n, i) => {
                  const isAlert = n.type === 'REJECT' || n.title.includes('CẢNH BÁO');
                  const isDone = n.taskStatus === 'DONE';
                  return (
                    <div key={n.id || i} style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: `1px solid ${isAlert ? 'rgba(239, 68, 68, 0.35)' : 'var(--glass-border)'}`,
                      background: isDone ? 'rgba(255,255,255,0.02)' : isAlert ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255,255,255,0.04)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', lineHeight: 1.35 }}>
                          {n.type === 'SUCCESS' ? <CheckCircle size={16} color="var(--success-color)" /> : <AlertTriangle size={16} color={isAlert ? 'var(--danger-color)' : 'var(--warning-color)'} />}
                          {n.title}
                        </h4>
                        <span className={`status-badge ${isDone ? 'badge-success' : n.readAt ? 'badge-muted' : 'badge-new'}`}>
                          {isDone ? 'Xong' : n.readAt ? 'Đã đọc' : 'Mới'}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '7px', lineHeight: '1.45' }}>{n.message}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', color: 'var(--text-muted)', fontSize: '11px', marginTop: '8px' }}>
                        <span>{n.relatedProfileId || 'Hệ thống'}</span>
                        <span>{formatNotificationTime(n.timestamp)}</span>
                      </div>
                      {!isDone && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                          {!n.readAt && (
                            <button className="btn btn-secondary" style={{ flex: 1, padding: '7px', fontSize: '12px' }} onClick={() => handleReadNotification(n.id)}>
                              <Eye size={14} /> Đã đọc
                            </button>
                          )}
                          <button className="btn btn-success" style={{ flex: 1, padding: '7px', fontSize: '12px' }} onClick={() => handleDoneNotification(n.id)}>
                            <Check size={14} /> Hoàn tất
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Unified Sidebar */}
      <aside className="glass-panel" style={{ borderRadius: '0', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100vh' }}>
        <div>
          <h2 className="text-gradient" style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '30px' }}>
            <ShieldCheck size={24} /> SEMINAR HUB
          </h2>

          <div style={{ marginBottom: '25px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>Đang đăng nhập</div>
            <div style={{ fontWeight: '800', marginBottom: '8px' }}>{currentUser.name}</div>
            <span className={`status-badge ${ROLE_META[currentRole]?.badge || 'badge-muted'}`}>{ROLE_META[currentRole]?.label}</span>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '12px', padding: '8px 10px', fontSize: '12px' }} onClick={handleLogout}>
              <LogOut size={14} /> Đăng xuất
            </button>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', marginBottom: '20px' }} />

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ROLE_NAV_ITEMS
              .filter(item => item.role === currentRole)
              .map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.role} className="btn btn-primary" style={{ justifyContent: 'start', width: '100%' }}>
                    <Icon size={16} /> {item.label}
                  </button>
                );
              })}
            <button
              className={`btn ${isNotificationPanelOpen ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'space-between', width: '100%', marginTop: '8px' }}
              onClick={() => setIsNotificationPanelOpen(prev => !prev)}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={16} /> Thông báo
              </span>
              {notificationCountLabel > 0 && (
                <span className={`status-badge ${unreadTaskCount > 0 ? 'badge-new' : 'badge-muted'}`}>
                  {notificationCountLabel}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Operational Statistics */}
        <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px' }}>
          <h5 style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Thống kê tổng hồ sơ</h5>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
            <div>Tổng số: <b>{profiles.length}</b></div>
            <div>Sẵn sàng: <b>{profiles.filter(p => p.status === 'Sẵn sàng tổ chức').length}</b></div>
            <div>Task mở: <b>{openTasks.length}</b></div>
            <div>Chưa đọc: <b>{unreadTaskCount}</b></div>
          </div>
          {currentRole === 'Role_Admin_Logistics' && (
            <button className="btn btn-secondary" style={{ width: '100%', fontSize: '11px', padding: '6px', marginTop: '12px' }} onClick={handleManualCountdown}>
              Chạy Job Đếm Ngược 14 Ngày
            </button>
          )}
        </div>
      </aside>

      {/* 3. Main Workspace Panel */}
      <main style={{ padding: '40px', overflowY: 'auto', height: '100vh' }}>
        
        {/* VIEW 1: BP DAT CHO (RESERVATION ROLE) */}
        {currentRole === 'Role_Reservation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 className="text-gradient">Phân hệ Tiếp nhận & Khởi tạo Hồ sơ</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Tiếp nhận dữ liệu đầu vào và theo dõi trạng thái</p>
              </div>
              <span className="status-badge badge-new">Role: BP Đặt chỗ</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '30px', alignItems: 'start' }}>
              
              {/* Form Creation or Edit */}
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

              {/* My Requests List */}
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
                        const canCancel = p.status === 'Bị từ chối / Tạm dừng' || (p.status === 'Mới tạo / Chờ xử lý' && !p.expertToken);
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
                                {/* F107: BP Dat cho can edit only if rejected */}
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px', minWidth: '32px' }} 
                                  disabled={!canEdit}
                                  title={canEdit ? "Sửa hồ sơ" : "Không thể sửa khi đang hậu cần"}
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
                                <button 
                                  className="btn btn-danger" 
                                  style={{ padding: '6px', minWidth: '32px' }}
                                  disabled={!canCancel}
                                  title={canCancel ? "Hủy hồ sơ" : "Không thể hủy sau khi Điều phối viên đã gửi lời mời hoặc hồ sơ đang xử lý"}
                                  onClick={() => handleCancelProfile(p.id)}
                                >
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
        )}

        {/* VIEW 2: COORDINATOR LOGISTICS PANEL */}
        {currentRole === 'Role_Admin_Logistics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 className="text-gradient">Bàn làm việc của Điều phối viên (Admin)</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Giám sát trạng thái, kết nối đối tác và xuất tài liệu</p>
              </div>
              <span className="status-badge badge-logistics">Role: Admin Logistics</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px', alignItems: 'start' }}>
              
              {/* Seminar Profiles List */}
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
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          Địa điểm: {p.city} | Ngày: {p.expectedDate}
                        </p>
                        {has14DayWarning && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger-color)', fontSize: '11px', fontWeight: 'bold', marginTop: '8px' }}>
                            <AlertTriangle size={12} /> CẢNH BÁO ĐẾN HẠN 14 NGÀY LÀM TÀI LIỆU!
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Profile Detailed Step-by-Step Logistics Wizard */}
              <div className="glass-panel">
                {selectedProfile ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h2 className="text-gradient">Hậu cần Chi tiết: {selectedProfile.id}</h2>
                      <span className="status-badge badge-logistics">{selectedProfile.status}</span>
                    </div>

                    {/* Dynamic Stepper Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', position: 'relative' }}>
                      {['Tiếp nhận', 'Chốt Expert', 'Hợp đồng', 'Vé & Xe', 'Ấn phẩm'].map((step, idx) => {
                        let active = false;
                        let completed = false;
                        const status = selectedProfile.status;

                        if (idx === 0) { completed = true; active = true; }
                        if (idx === 1) { 
                          completed = status !== 'Mới tạo / Chờ xử lý' && status !== 'Bị từ chối / Tạm dừng'; 
                          active = status === 'Mới tạo / Chờ xử lý' || status === 'Bị từ chối / Tạm dừng'; 
                        }
                        if (idx === 2) { 
                          completed = status === 'Đã chốt địa điểm' || status === 'Đang gửi tài liệu' || status === 'Sẵn sàng tổ chức'; 
                          active = status === 'Đang xử lý hậu cần'; 
                        }
                        if (idx === 3) {
                          completed = selectedProfile.ticketCode != null;
                          active = (status === 'Đã chốt địa điểm' || status === 'Đang gửi tài liệu') && !selectedProfile.ticketCode;
                        }
                        if (idx === 4) {
                          completed = status === 'Sẵn sàng tổ chức';
                          active = (status === 'Đã chốt địa điểm' || status === 'Đang gửi tài liệu') && selectedProfile.ticketCode;
                        }

                        return (
                          <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1, zIndex: 2 }}>
                            <div style={{ 
                              width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: completed ? 'var(--success-gradient)' : active ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)',
                              border: '1px solid ' + (active ? 'var(--accent-primary)' : 'var(--glass-border)'), fontSize: '13px', fontWeight: 'bold'
                            }}>
                              {completed ? <Check size={16} /> : idx + 1}
                            </div>
                            <span style={{ fontSize: '11px', color: active ? 'white' : 'var(--text-secondary)' }}>{step}</span>
                          </div>
                        );
                      })}
                      {/* Stepper background line */}
                      <div style={{ position: 'absolute', top: '16px', left: '10%', right: '10%', height: '2px', background: 'var(--glass-border)', zIndex: 1 }}></div>
                    </div>

                    {/* Operational Actions based on current status */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                      
                      {/* Section 1: Expert invitation */}
                      <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <h4 style={{ marginBottom: '10px' }}>1. Mời Chuyên gia</h4>
                        <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div>Chuyên gia: <b>{selectedProfile.expert.name}</b> ({selectedProfile.expert.email})</div>
                          {selectedProfile.desiredSchedule && (
                            <div style={{ color: 'var(--success-color)' }}>Lịch trình chốt: <b>{selectedProfile.desiredSchedule}</b></div>
                          )}
                          {selectedProfile.expertNotes && (
                            <div style={{ color: 'var(--danger-color)' }}>Phản hồi Chuyên gia từ chối: <b>{selectedProfile.expertNotes}</b></div>
                          )}
                          {selectedProfile.status === 'Đã hủy' ? (
                            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.08)', borderLeft: '3px solid var(--danger-color)', borderRadius: '4px', color: 'var(--danger-color)' }}>
                              Hồ sơ đã hủy. Không thể gửi lời mời hoặc thông báo cho chuyên gia.
                            </div>
                          ) : !selectedProfile.expertToken ? (
                            <button className="btn btn-primary" onClick={() => handleSendExpertInvite(selectedProfile.id)}>
                              <Send size={14} /> Gửi Email Lời mời tự động
                            </button>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                              <span className="status-badge badge-success">Đã gửi email link token</span>
                              <input type="text" className="form-input" style={{ padding: '6px', fontSize: '11px', width: '200px' }} readOnly value={`${window.location.origin}/?token=${selectedProfile.expertToken}`} />
                              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/?token=${selectedProfile.expertToken}`);
                                alert("Đã copy link expert portal!");
                              }}>Copy</button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section 2: Propose flights options */}
                      {(selectedProfile.status === 'Đang xử lý hậu cần' || selectedProfile.status === 'Đã chốt địa điểm' || selectedProfile.status === 'Đang gửi tài liệu') && (
                        <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <h4 style={{ marginBottom: '10px' }}>2. Thiết lập Phương án Vé máy bay</h4>
                          {selectedProfile.desiredSchedule && (
                            <div style={{ padding: '10px 15px', background: 'rgba(245, 158, 11, 0.08)', borderLeft: '3px solid var(--warning-color)', borderRadius: '4px', marginBottom: '15px', fontSize: '12px' }}>
                              <span style={{ color: 'var(--warning-color)', fontWeight: 'bold' }}>⚠️ Lịch trình & Ngày mong muốn của Chuyên gia:</span>
                              <div style={{ marginTop: '4px', color: 'white', fontWeight: '500' }}>{selectedProfile.desiredSchedule}</div>
                            </div>
                          )}
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Đề xuất 2 phương án chuyến bay phù hợp gửi qua email cho chuyên gia chọn:</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                            {flightOptions.map((opt, i) => (
                              <div key={i} style={{ display: 'flex', gap: '10px' }}>
                                <input type="text" className="form-input" style={{ flex: 2, fontSize: '12px' }} value={opt.flightDetails} disabled={selectedTravelOptions.length > 0} onChange={e => {
                                  const copy = [...flightOptions];
                                  copy[i].flightDetails = e.target.value;
                                  setFlightOptions(copy);
                                }} />
                                <input type="number" className="form-input" style={{ flex: 1, fontSize: '12px' }} value={opt.estimatedCost} disabled={selectedTravelOptions.length > 0} onChange={e => {
                                  const copy = [...flightOptions];
                                  copy[i].estimatedCost = e.target.value;
                                  setFlightOptions(copy);
                                }} />
                              </div>
                            ))}
                          </div>
                          <button className="btn btn-primary" disabled={selectedTravelOptions.length > 0} onClick={() => handleProposeFlights(selectedProfile.id)}>
                            <Send size={14} /> Gửi phương án vé cho Chuyên gia
                          </button>
                          {selectedTravelOptions.length > 0 && (
                            <span style={{ color: 'var(--success-color)', fontSize: '12px', display: 'block', marginTop: '8px', fontWeight: '500' }}>✓ Đã gửi phương án vé và đang khóa chỉnh sửa.</span>
                          )}
                        </div>
                      )}

                      {/* Section 3: Venue suggestions & contract negotiations */}
                      {selectedProfile.status === 'Đang xử lý hậu cần' && (
                        <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <h4 style={{ marginBottom: '10px' }}>3. Địa điểm & Thương thảo Hợp đồng</h4>
                          
                          {/* Resource Estimation card */}
                          <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.05)', borderLeft: '3px solid var(--accent-primary)', borderRadius: '4px', marginBottom: '15px', fontSize: '12px' }}>
                            <b>Hệ thống tự động xuất bảng dự toán tài nguyên:</b>
                            <div style={{ marginTop: '6px' }}>Min phòng: <b>{selectedProfile.expectedAttendees * 2} m2</b> | Setup: <b>{selectedProfile.seminarType.toLowerCase().includes("chuyên sâu") ? "U-Shape" : "Classroom"}</b></div>
                          </div>

                          {/* Hotel search suggestions engine */}
                          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <input type="text" className="form-input" placeholder="Tìm thành phố (Hanoi, Da Nang...)" value={venueKeyword} onChange={e => setVenueKeyword(e.target.value)} />
                            <button className="btn btn-secondary" onClick={() => handleSearchVenues(venueKeyword, selectedProfile.expectedAttendees)}>
                              <Search size={14} /> Tìm gợi ý
                            </button>
                          </div>

                          {/* Hotel suggestions result list */}
                          {suggestedVenues.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', maxHeight: '180px', overflowY: 'auto' }}>
                              {suggestedVenues.map(v => (
                                <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--glass-border)', fontSize: '12px' }}>
                                  <div>
                                    <b>{v.name}</b> (Sức chứa: {v.capacity} người)
                                    <div>Ước tính: {v.estimatedCost} VND</div>
                                  </div>
                                  <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => handleBookVenue(selectedProfile.id, v.id)}>Chọn Đặt</button>
                                </div>
                              ))}
                            </div>
                          )}                          {/* List of active venue proposal requests and Sales Portal Tokens (F3.3 & F3.4) */}
                          {selectedVenues.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                              <h5 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>Yêu cầu đặt phòng đã gửi:</h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {selectedVenues.map(sv => (
                                  <div key={sv.id} className="glass-panel" style={{ 
                                    background: 'rgba(255, 255, 255, 0.01)', padding: '10px 15px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px'
                                  }}>
                                    <div>
                                      <b>{sv.venueName}</b> ({sv.venueCity})
                                      {sv.status === 'PENDING' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                                          <span style={{ color: 'var(--warning-color)' }}>Link đàm phán của Hotel Sales:</span>
                                          <input type="text" className="form-input" style={{ padding: '4px 8px', fontSize: '11px', width: '260px' }} readOnly value={`${window.location.origin}/?token=${sv.salesToken}`} />
                                          <button type="button" className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '10px' }} onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/?token=${sv.salesToken}`);
                                            alert("Đã copy link hotel portal!");
                                          }}>Copy</button>
                                          <button type="button" className="btn btn-primary" style={{ padding: '3px 8px', fontSize: '10px' }} onClick={() => window.open(`${window.location.origin}/?token=${sv.salesToken}`, '_blank', 'noopener,noreferrer')}>
                                            Mở portal
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    <span className={`status-badge ${
                                      sv.status === 'SELECTED' ? 'badge-success' :
                                      sv.status === 'REJECTED' ? 'badge-rejected' : 'badge-logistics'
                                    }`}>{sv.status}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* List of Negotiated Contracts history for Admin (F3.4) */}
                          {selectedContracts.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                              <h5 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>Tiến trình đàm phán hợp đồng kinh tế:</h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {selectedContracts.map(c => (
                                  <div key={c.id} className="glass-panel" style={{ 
                                    background: 'rgba(255, 255, 255, 0.02)', padding: '10px 15px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px'
                                  }}>
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontWeight: '800', color: 'var(--accent-primary)' }}>v{c.version}</span>
                                        <b>{c.fileName}</b>
                                      </div>
                                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                        Người gửi: <b>{c.uploadedBy}</b> | Nội dung: <i>{c.notes}</i>
                                      </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                      <span className={`status-badge ${c.status === 'APPROVED' ? 'badge-success' : c.status === 'REJECTED' ? 'badge-rejected' : 'badge-logistics'}`}>{c.status}</span>
                                      <a href={`/api/external/contract/${c.id}/download`} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
                                        <Download size={12} /> Tải
                                      </a>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Negotiate Contract & Upload administrative revisions */}
                          {(() => {
                            if (selectedContracts.length === 0) {
                              const pendingSalesVenue = selectedVenues.find(sv => sv.status === 'PENDING' && sv.salesToken);
                              const hasVenueRequest = selectedVenues.length > 0;
                              const salesPortalUrl = pendingSalesVenue ? `${window.location.origin}/?token=${pendingSalesVenue.salesToken}` : '';

                              return (
                                <div style={{ padding: '15px', background: 'rgba(245, 158, 11, 0.05)', borderLeft: '3px solid var(--warning-color)', borderRadius: '6px', fontSize: '12px', color: 'var(--warning-color)' }}>
                                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                    {pendingSalesVenue ? '⏳ Chờ đợi Hợp đồng:' : hasVenueRequest ? '⏳ Đang xử lý yêu cầu khách sạn:' : 'Chưa gửi yêu cầu đặt phòng:'}
                                  </div>
                                  {pendingSalesVenue ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                      <div>Đang chờ <b>{pendingSalesVenue.venueName}</b> chấp nhận đặt phòng và tải lên bản dự thảo hợp đồng đầu tiên (v1).</div>
                                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <input type="text" className="form-input" style={{ maxWidth: '420px', padding: '8px 10px', fontSize: '12px', color: 'white' }} readOnly value={salesPortalUrl} />
                                        <button type="button" className="btn btn-secondary" style={{ padding: '7px 12px', fontSize: '12px' }} onClick={() => {
                                          navigator.clipboard.writeText(salesPortalUrl);
                                          alert("Đã copy link hotel portal!");
                                        }}>Copy link</button>
                                        <button type="button" className="btn btn-primary" style={{ padding: '7px 12px', fontSize: '12px' }} onClick={() => window.open(salesPortalUrl, '_blank', 'noopener,noreferrer')}>
                                          Mở portal khách sạn
                                        </button>
                                      </div>
                                    </div>
                                  ) : hasVenueRequest ? (
                                    <div>Không còn yêu cầu khách sạn nào đang chờ phản hồi. Kiểm tra trạng thái danh sách yêu cầu đặt phòng phía trên.</div>
                                  ) : (
                                    <div>Hãy bấm <b>Tìm gợi ý</b>, chọn một khách sạn bằng nút <b>Chọn Đặt</b>, sau đó hệ thống mới tạo link portal để khách sạn chấp nhận và tải hợp đồng.</div>
                                  )}
                                </div>
                              );
                            }

                            const latestContract = selectedContracts[0];
                            const isWaitingForSales = latestContract.uploadedBy === 'ADMIN';

                            if (isWaitingForSales) {
                              return (
                                <div style={{ padding: '15px', background: 'rgba(245, 158, 11, 0.08)', borderLeft: '4px solid var(--warning-color)', borderRadius: '6px', fontSize: '13px' }}>
                                  <h5 style={{ color: 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <AlertTriangle size={16} /> Đang chờ phản hồi từ phía Khách sạn
                                  </h5>
                                  <p>Bạn đã tải lên bản hợp đồng sửa đổi <b>v{latestContract.version}</b>. Vui lòng chờ đối tác Hotel Sales phản hồi bản sửa đổi tiếp theo.</p>
                                </div>
                              );
                            }

                            return (
                              <form onSubmit={(e) => handleAdminUploadRevision(e, selectedProfile.id)} className="glass-panel" style={{ background: 'rgba(255,255,255,0.01)' }}>
                                <h5 style={{ marginBottom: '8px' }}>Thương thảo/Tải lên bản sửa đổi hợp đồng (Admin)</h5>
                                <div className="form-group">
                                  <input type="file" id="admin-contract-revision-file" className="form-input" required style={{ padding: '6px' }} disabled={isSubmitting} />
                                </div>
                                <div className="form-group">
                                  <input type="text" className="form-input" style={{ padding: '6px' }} placeholder="Ghi chú yêu cầu chỉnh sửa..." value={negotiationNotes} onChange={e => setNegotiationNotes(e.target.value)} required disabled={isSubmitting} />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button type="submit" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} disabled={isSubmitting}>
                                    <FileUp size={14} /> {isSubmitting ? "Đang tải..." : "Tải bản sửa đổi"}
                                  </button>
                                  <button type="button" className="btn btn-success" style={{ padding: '6px 12px', fontSize: '12px' }} disabled={isSubmitting} onClick={() => handleApproveContract(selectedProfile.id)}>
                                    {isSubmitting ? "Đang phê duyệt..." : "Hoàn tất đàm phán"}
                                  </button>
                                </div>
                              </form>
                            );
                          })()}
                        </div>
                      )}

                      {/* Section 4: Travel Flight update ticket code */}
                      {(selectedProfile.status === 'Đã chốt địa điểm' || selectedProfile.status === 'Đang gửi tài liệu' || selectedProfile.status === 'Sẵn sàng tổ chức') && (
                        <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <h4 style={{ marginBottom: '10px' }}>4. Quản lý Đi lại & Đặt vé máy bay</h4>
                          
                          {/* Sync & Display expert's selected flight (F4.2) */}
                          {(() => {
                            const chosenFlight = selectedTravelOptions.find(opt => opt.status === 'SELECTED');
                            if (chosenFlight) {
                              return (
                                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderLeft: '3px solid var(--success-color)', borderRadius: '4px', marginBottom: '15px', fontSize: '13px' }}>
                                  <h5 style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                                    <CheckCircle size={16} /> Chuyên gia đã chốt chuyến bay!
                                  </h5>
                                  <div>Phương án đã chọn: <b>{chosenFlight.flightDetails}</b></div>
                                  <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px' }}>
                                    Hệ thống đã tự động gửi <b>Phiếu đặt vé & Đưa đón</b> qua Email cho Công ty du lịch.
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.05)', borderLeft: '3px solid var(--warning-color)', borderRadius: '4px', marginBottom: '15px', fontSize: '13px', color: 'var(--warning-color)' }}>
                                  Đang chờ Chuyên gia truy cập liên kết mời và lựa chọn phương án chuyến bay...
                                </div>
                              );
                            }
                          })()}

                          {selectedProfile.ticketCode ? (
                            <div style={{ background: 'rgba(16,185,129,0.05)', padding: '12px', borderRadius: '4px', border: '1px solid var(--success-color)', fontSize: '13px' }}>
                              Mã vé đã chốt: <span style={{ fontWeight: '800' }}>{selectedProfile.ticketCode}</span>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Hệ thống đã tự động gửi email lộ trình di chuyển chính thức cho Chuyên gia.</div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                              {selectedTravelOptions.some(opt => opt.status === 'SELECTED') && (
                                <div className="glass-panel" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '15px' }}>
                                  <h5 style={{ color: 'white', marginBottom: '8px' }}>Phương án đặt vé máy bay tự động qua API đối tác:</h5>
                                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>Hệ thống sẽ đồng bộ thông tin chuyến bay chuyên gia chọn và gọi API Gateway hãng bay để đặt vé:</p>
                                  <button className="btn btn-success" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => handleBookFlightViaApi(selectedProfile.id)}>
                                    <Plane size={16} /> Đồng bộ & Gọi API Đặt Vé
                                  </button>
                                </div>
                              )}
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Hoặc nhập mã code vé máy bay thủ công do Công ty du lịch phản hồi:</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <input type="text" className="form-input" placeholder="Nhập Code vé máy bay thủ công" value={ticketCodeInput} onChange={e => setTicketCodeInput(e.target.value)} />
                                  <button className="btn btn-primary" onClick={() => handleUpdateTicket(selectedProfile.id)}>Cập nhật thủ công</button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Section 5: Publications counting and process final close */}
                      {((selectedProfile.status === 'Đã chốt địa điểm' || selectedProfile.status === 'Đang gửi tài liệu') && selectedProfile.ticketCode) && (
                        <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <h4 style={{ marginBottom: '10px' }}>5. Đóng quy trình & Quản lý Tài liệu</h4>
                          
                          {/* Counting materials */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                            <div className="form-group">
                              <label className="form-label">Nhập Số lượng đại biểu thực tế chốt cuối *</label>
                              <input type="number" className="form-input" placeholder="Ví dụ: 48" value={actualAttendees} onChange={e => setActualAttendees(e.target.value)} />
                            </div>
                            {actualAttendees && (
                              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', fontSize: '12px' }}>
                                <b>Tính toán số lượng ấn phẩm chuẩn xuất kho:</b>
                                <ul style={{ paddingLeft: '15px', marginTop: '6px' }}>
                                  <li>Sách tài liệu hội thảo (1 bộ/người): <b>{actualAttendees} cuốn</b></li>
                                  <li>Brochures tờ rơi (2 bộ/người): <b>{actualAttendees * 2} tờ</b></li>
                                  <li>Thẻ tên đại biểu (1 bộ/người): <b>{actualAttendees} cái</b></li>
                                </ul>
                              </div>
                            )}
                            {selectedProfile.documentShipped ? (
                              <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderLeft: '3px solid var(--success-color)', borderRadius: '4px', fontSize: '12px', color: 'var(--success-color)' }}>
                                <b>✅ Đã kết xuất & Gửi lệnh chuẩn bị tài liệu:</b> Phiếu PDF vận chuyển ấn phẩm đã được chuyển sang BP Xử lý tài liệu để đóng gói.
                              </div>
                            ) : (
                              <button className="btn btn-primary" disabled={isSubmitting} onClick={() => handleFinalizeDocs(selectedProfile.id)}>
                                {isSubmitting ? "Đang xử lý..." : "Kết xuất Phiếu vận chuyển PDF & Gửi BP Tài liệu"}
                              </button>
                            )}
                          </div>

                          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '15px 0' }} />

                          {/* Confirm completion */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {selectedProfile.documentShipped && !selectedProfile.documentReady && (
                              <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.05)', borderLeft: '3px solid var(--warning-color)', borderRadius: '4px', fontSize: '12px', color: 'var(--warning-color)' }}>
                                <b>⏳ Đang chờ xác nhận:</b> Chờ bộ phận Xử lý tài liệu hoàn tất khâu chuẩn bị và gửi thông báo xác nhận...
                              </div>
                            )}
                            
                            {selectedProfile.documentReady && (
                              <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderLeft: '3px solid var(--success-color)', borderRadius: '4px', fontSize: '12px', color: 'var(--success-color)' }}>
                                <b>✅ BP Tài liệu xác nhận:</b> Đã chuẩn bị, đóng gói xong toàn bộ tài liệu hội thảo hội trường!
                              </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginTop: '10px' }}>
                              <input type="checkbox" id="hotel-receipt" checked={hotelConfirmed} onChange={e => setHotelConfirmed(e.target.checked)} disabled={!selectedProfile.documentReady} />
                              <label htmlFor="hotel-receipt" style={{ opacity: selectedProfile.documentReady ? 1 : 0.5 }}>Khách sạn xác nhận đã nhận bàn giao đủ ấn phẩm tài liệu</label>
                            </div>
                            <button className="btn btn-success" disabled={!selectedProfile.documentReady || isSubmitting} onClick={() => handleCompleteLogistics(selectedProfile.id)}>
                              {isSubmitting ? "Đang hoàn tất..." : "Hoàn tất quy trình Hậu cần"}
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <AlertTriangle size={48} style={{ margin: '0 auto 15px', opacity: '0.4' }} />
                    <p>Vui lòng chọn một hồ sơ bên trái để hiển thị bảng điều khiển hậu cần chi tiết.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* VIEW 3: DOCUMENT PROCESSING ROLE */}
        {currentRole === 'Role_Doc_Processor' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 className="text-gradient">Phân hệ Xử lý & Chuẩn bị Tài liệu</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Quản lý in ấn, đóng gói và xác nhận hoàn tất ấn phẩm hội thảo</p>
              </div>
              <span className="status-badge badge-success">Role: BP Xử lý tài liệu</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px', alignItems: 'start' }}>
              {/* Shipped Profiles List */}
              <div className="glass-panel">
                <h3 style={{ marginBottom: '15px' }}>Yêu cầu ấn phẩm cần xử lý</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {profiles.filter(p => p.documentShipped).length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Chưa có yêu cầu xuất kho ấn phẩm nào được gửi tới.</p>
                  ) : (
                    profiles.filter(p => p.documentShipped).map(p => {
                      const isSelected = selectedProfile && selectedProfile.id === p.id;
                      return (
                        <div key={p.id} className={`glass-panel ${isSelected ? 'glass-panel-glow' : ''}`} style={{ 
                          cursor: 'pointer', padding: '16px', background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
                          borderColor: isSelected ? 'var(--success-color)' : 'var(--glass-border)'
                        }} onClick={() => setSelectedProfile(p)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '800' }}>{p.id}</span>
                            <span className={`status-badge ${p.documentReady ? 'badge-success' : 'badge-logistics'}`}>
                              {p.documentReady ? 'Đã chuẩn bị xong' : 'Chờ chuẩn bị'}
                            </span>
                          </div>
                          <h4 style={{ marginTop: '8px', fontSize: '14px' }}>{p.seminarType}</h4>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Số lượng đại biểu chốt: <b>{p.actualAttendees} người</b>
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Detailed Document Preparation slip & confirm ready */}
              <div className="glass-panel">
                {selectedProfile && selectedProfile.documentShipped ? (
                  <div>
                    <h3 style={{ marginBottom: '20px' }}>Chi tiết lệnh chuẩn bị tài liệu: <span className="text-gradient">{selectedProfile.id}</span></h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <h4 style={{ marginBottom: '12px', color: 'var(--accent-primary)' }}>Định mức chuẩn xuất kho ấn phẩm:</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', paddingLeft: '15px' }}>
                          <li>Sách tài liệu hội thảo: <b>{selectedProfile.actualAttendees} cuốn</b></li>
                          <li>Brochures tờ rơi (gấp đôi số lượng đại biểu): <b>{selectedProfile.actualAttendees * 2} tờ</b></li>
                          <li>Thẻ tên đại biểu: <b>{selectedProfile.actualAttendees} thẻ</b></li>
                        </ul>
                      </div>

                      <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <h4 style={{ marginBottom: '8px', color: 'white' }}>Địa chỉ giao hàng hội thảo:</h4>
                        <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
                          Vận chuyển hỏa tốc đến: <b>Khách sạn đối tác tại thành phố {selectedProfile.city}</b>
                        </p>
                      </div>

                      {selectedProfile.documentReady ? (
                        <div style={{ padding: '20px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', border: '1px solid var(--success-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <CheckCircle size={24} color="var(--success-color)" />
                          <div>
                            <h4 style={{ color: 'var(--success-color)' }}>Đã hoàn tất chuẩn bị & Đóng gói!</h4>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Hệ thống đã gửi thông báo xác nhận và lệnh chuyển hàng sang cho Ban điều phối.</p>
                          </div>
                        </div>
                      ) : (
                        <button 
                          className="btn btn-success" 
                          disabled={isSubmitting} 
                          onClick={async () => {
                            if (isSubmitting) return;
                            setIsSubmitting(true);
                            try {
                              const res = await fetch(`/api/seminars/${selectedProfile.id}/doc-ready`, {
                                method: 'POST',
                                headers: { 'X-Role': currentRole }
                              });
                              if (res.ok) {
                                alert("Đã xác nhận chuẩn bị xong toàn bộ tài liệu! Hệ thống đã gửi thông báo cho Ban điều phối.");
                                fetchProfiles();
                                setSelectedProfile(null);
                              } else {
                                const err = await res.text();
                                alert(err);
                              }
                            } catch (e) {
                              alert(e);
                            } finally {
                              setIsSubmitting(false);
                            }
                          }}
                          style={{ width: '100%', padding: '12px', fontSize: '15px' }}
                        >
                          {isSubmitting ? "Đang xử lý..." : "Xác nhận Đã hoàn tất & Đóng gói xong tài liệu"}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <AlertTriangle size={48} style={{ margin: '0 auto 15px', opacity: '0.4' }} />
                    <p>Vui lòng chọn một lệnh ấn phẩm cần chuẩn bị ở bên trái.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
