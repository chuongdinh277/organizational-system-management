import React from 'react';
import { AlertTriangle, Check, Send, Search, FileUp, Download, Plane, CheckCircle } from 'lucide-react';

export default function PanelCoordinator({ profiles, selectedProfile, setSelectedProfile, flightOptions, setFlightOptions, selectedTravelOptions, venueKeyword, setVenueKeyword, suggestedVenues, selectedVenues, selectedContracts, negotiationNotes, setNegotiationNotes, ticketCodeInput, setTicketCodeInput, actualAttendees, setActualAttendees, hotelConfirmed, setHotelConfirmed, isSubmitting, handleSendExpertInvite, handleSearchVenues, handleBookVenue, handleProposeFlights, handleAdminUploadRevision, handleApproveContract, handleBookFlightViaApi, handleUpdateTicket, handleFinalizeDocs, handleCompleteLogistics }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient">Bàn làm việc của Điều phối viên (Admin)</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Giám sát trạng thái, kết nối đối tác và xuất tài liệu</p>
        </div>
        <span className="status-badge badge-logistics">Role: Admin Logistics</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px', alignItems: 'start' }}>
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
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Địa điểm: {p.city} | Ngày: {p.expectedDate}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel">
          {selectedProfile ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="text-gradient">Hậu cần Chi tiết: {selectedProfile.id}</h2>
              </div>

              {/* Dynamic Stepper */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', position: 'relative' }}>
                {['Tiếp nhận', 'Chốt Expert', 'Hợp đồng', 'Vé & Xe', 'Ấn phẩm'].map((step, idx) => {
                  let active = false, completed = false;
                  const status = selectedProfile.status;
                  if (idx === 0) { completed = true; active = true; }
                  if (idx === 1) { completed = status !== 'Mới tạo / Chờ xử lý' && status !== 'Bị từ chối / Tạm dừng'; active = status === 'Mới tạo / Chờ xử lý' || status === 'Bị từ chối / Tạm dừng'; }
                  if (idx === 2) { completed = status === 'Đã chốt địa điểm' || status === 'Đang gửi tài liệu' || status === 'Sẵn sàng tổ chức'; active = status === 'Đang xử lý hậu cần'; }
                  if (idx === 3) { completed = selectedProfile.ticketCode != null; active = (status === 'Đã chốt địa điểm' || status === 'Đang gửi tài liệu') && !selectedProfile.ticketCode; }
                  if (idx === 4) { completed = status === 'Sẵn sàng tổ chức'; active = (status === 'Đã chốt địa điểm' || status === 'Đang gửi tài liệu') && selectedProfile.ticketCode; }

                  return (
                    <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1, zIndex: 2 }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: completed ? 'var(--success-gradient)' : active ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)', border: '1px solid ' + (active ? 'var(--accent-primary)' : 'var(--glass-border)'), fontSize: '13px', fontWeight: 'bold' }}>
                        {completed ? <Check size={16} /> : idx + 1}
                      </div>
                      <span style={{ fontSize: '11px', color: active ? 'white' : 'var(--text-secondary)' }}>{step}</span>
                    </div>
                  );
                })}
                <div style={{ position: 'absolute', top: '16px', left: '10%', right: '10%', height: '2px', background: 'var(--glass-border)', zIndex: 1 }}></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {/* 1. Expert Panel */}
                <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <h4>1. Mời Chuyên gia</h4>
                  <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    <div>Chuyên gia: <b>{selectedProfile.expert.name}</b></div>
                    {selectedProfile.desiredSchedule && <div style={{ color: 'var(--success-color)' }}>Lịch trình chốt: <b>{selectedProfile.desiredSchedule}</b></div>}
                    {!selectedProfile.expertToken ? (
                      <button className="btn btn-primary" onClick={() => handleSendExpertInvite(selectedProfile.id)}><Send size={14} /> Gửi Email Lời mời tự động</button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="status-badge badge-success">Đã gửi link</span>
                        <input type="text" className="form-input" style={{ padding: '6px', fontSize: '11px', width: '180px' }} readOnly value={`${window.location.origin}/?token=${selectedProfile.expertToken}`} />
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Flights Panel */}
                {(selectedProfile.status === 'Đang xử lý hậu cần' || selectedProfile.status === 'Đã chốt địa điểm' || selectedProfile.status === 'Đang gửi tài liệu') && (
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
                    <button className="btn btn-primary" disabled={selectedTravelOptions.length > 0} onClick={() => handleProposeFlights(selectedProfile.id)}><Send size={14} /> Gửi phương án cho Chuyên gia</button>
                  </div>
                )}

                {/* 3. Venue Contracts Panel */}
                {selectedProfile.status === 'Đang xử lý hậu cần' && (
                  <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <h4>3. Địa điểm & Thương thảo Hợp đồng</h4>
                    <div style={{ display: 'flex', gap: '10px', margin: '12px 0' }}>
                      <input type="text" className="form-input" placeholder="Thành phố..." value={venueKeyword} onChange={e => setVenueKeyword(e.target.value)} />
                      <button className="btn btn-secondary" onClick={() => handleSearchVenues(venueKeyword, selectedProfile.expectedAttendees)}><Search size={14} /> Tìm</button>
                    </div>

                    {suggestedVenues.map(v => (
                      <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', marginBottom: '8px', borderRadius: '4px', fontSize: '12px' }}>
                        <div><b>{v.name}</b> (Sức chứa: {v.capacity} người)</div>
                        <button className="btn btn-primary" style={{ padding: '4px' }} onClick={() => handleBookVenue(selectedProfile.id, v.id)}>Chọn Đặt</button>
                      </div>
                    ))}

                    {selectedContracts.length > 0 && (
                      <form onSubmit={(e) => handleAdminUploadRevision(e, selectedProfile.id)} className="glass-panel" style={{ background: 'rgba(255,255,255,0.01)' }}>
                        <input type="file" id="admin-contract-revision-file" className="form-input" required style={{ padding: '6px' }} />
                        <input type="text" className="form-input" style={{ padding: '6px', marginTop: '8px' }} placeholder="Ghi chú sửa đổi..." value={negotiationNotes} onChange={e => setNegotiationNotes(e.target.value)} required />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button type="submit" className="btn btn-secondary" style={{ padding: '6px' }}><FileUp size={14} /> Gửi sửa đổi</button>
                          <button type="button" className="btn btn-success" style={{ padding: '6px' }} onClick={() => handleApproveContract(selectedProfile.id)}>Phê duyệt chốt</button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* 4. Flights Ticket Execution */}
                {(selectedProfile.status === 'Đã chốt địa điểm' || selectedProfile.status === 'Đang gửi tài liệu' || selectedProfile.status === 'Sẵn sàng tổ chức') && (
                  <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <h4>4. Quản lý Đi lại & Đặt vé</h4>
                    {selectedProfile.ticketCode ? (
                      <div style={{ background: 'rgba(16,185,129,0.05)', padding: '12px', borderRadius: '4px', border: '1px solid var(--success-color)' }}>Mã vé đã chốt: <b>{selectedProfile.ticketCode}</b></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {selectedTravelOptions.some(opt => opt.status === 'SELECTED') && (
                          <button className="btn btn-success" onClick={() => handleBookFlightViaApi(selectedProfile.id)}><Plane size={16} /> Gọi API Đặt Vé Tự Động</button>
                        )}
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input type="text" className="form-input" placeholder="Mã vé thủ công..." value={ticketCodeInput} onChange={e => setTicketCodeInput(e.target.value)} />
                          <button className="btn btn-primary" onClick={() => handleUpdateTicket(selectedProfile.id)}>Cập nhật</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Document Closure */}
                {((selectedProfile.status === 'Đã chốt địa điểm' || selectedProfile.status === 'Đang gửi tài liệu') && selectedProfile.ticketCode) && (
                  <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <h4>5. Đóng quy trình & Quản lý Tài liệu</h4>
                    <div className="form-group">
                      <label className="form-label">Đại biểu thực tế *</label>
                      <input type="number" className="form-input" value={actualAttendees} onChange={e => setActualAttendees(e.target.value)} />
                    </div>
                    {!selectedProfile.documentShipped ? (
                      <button className="btn btn-primary" onClick={() => handleFinalizeDocs(selectedProfile.id)}>Kết xuất lệnh xuất kho ấn phẩm</button>
                    ) : (
                      <div style={{ color: 'var(--success-color)', fontSize: '12px' }}>✓ Đã kết xuất phiếu vận chuyển PDF sang BP Tài liệu.</div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '15px' }}>
                      <input type="checkbox" id="hotel-receipt" checked={hotelConfirmed} onChange={e => setHotelConfirmed(e.target.checked)} disabled={!selectedProfile.documentReady} />
                      <label htmlFor="hotel-receipt">Khách sạn xác nhận nhận đủ ấn phẩm</label>
                    </div>
                    <button className="btn btn-success" style={{ width: '100%', marginTop: '10px' }} disabled={!selectedProfile.documentReady} onClick={() => handleCompleteLogistics(selectedProfile.id)}>Hoàn tất quy trình Hậu cần</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}><AlertTriangle size={48} style={{ margin: '0 auto', opacity: '0.4' }} /><p style={{ marginTop: '10px' }}>Chọn hồ sơ bên trái để xử lý hậu cần.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}