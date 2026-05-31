import React from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

export default function RealtimeToast({ notifications, setNotifications }) {
  return (
    <div style={{ 
      position: 'fixed', top: '20px', right: '20px', zIndex: 10000, 
      display: 'flex', flexDirection: 'column', gap: '10px', width: '350px' 
    }}>
      {notifications.map((n, i) => (
        <div key={i} className={`glass-panel slide-in ${n.type === 'REJECT' || n.title.includes('CẢNH BÁO') ? 'pulse-alert-red' : ''}`} style={{ 
          background: n.type === 'REJECT' || n.title.includes('CẢNH BÁO') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(17, 24, 39, 0.95)',
          borderLeft: `4px solid ${n.type === 'SUCCESS' ? 'var(--success-color)' : n.type === 'REJECT' ? 'var(--danger-color)' : 'var(--accent-primary)'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              {n.type === 'SUCCESS' ? <CheckCircle size={16} color="var(--success-color)" /> : <AlertTriangle size={16} color={n.type === 'REJECT' ? 'var(--danger-color)' : 'var(--warning-color)'} />}
              {n.title}
            </h4>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setNotifications(prev => prev.filter(item => item.timestamp !== n.timestamp))}>
              <X size={14} />
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.4' }}>{n.message}</p>
        </div>
      ))}
    </div>
  );
}