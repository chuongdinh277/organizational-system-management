import React from 'react';
import useAuth from '../hooks/useAuth';

export default function AuthPage({ onLoginSuccess }) {
  const {
    isLoginMode,
    setIsLoginMode,
    loading,
    message,
    username,
    setUsername,
    password,
    setPassword,
    fullName,
    setFullName,
    role,
    setRole,
    handleSubmit
  } = useAuth(onLoginSuccess);

  return (
    <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'radial-gradient(circle at top, rgba(59,130,246,0.012), transparent 40%), #050816' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '32px', borderRadius: '24px', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 style={{ marginBottom: '20px', color: 'white', textAlign: 'center' }}>{isLoginMode ? 'Đăng nhập hệ thống' : 'Đăng ký tài khoản'}</h2>

        {message.text && (
          <div className={`alert ${message.type === 'error' ? 'alert-danger' : 'alert-success'}`} style={{ marginBottom: '18px', padding: '14px', borderRadius: '12px', color: message.type === 'error' ? '#f8d7da' : '#d1fae5', background: message.type === 'error' ? 'rgba(248, 113, 113, 0.12)' : 'rgba(52, 211, 153, 0.12)' }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tài khoản</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tài khoản"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          {!isLoginMode && (
            <>
              <div className="form-group">
                <label className="form-label">Họ và tên</label>
                <input
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Vai trò chức năng phân quyền</label>
                <select
                    className="form-input"
                    style={{ background: '#0b0f19', color: 'white' }}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                >
                    <option value="Role_Reservation">Bộ phận Đặt chỗ (Reservation)</option>
                    <option value="Role_Admin_Logistics">Điều phối viên (Admin Logistics)</option>
                    <option value="Role_Doc_Processor">Bộ phận Xử lý tài liệu (Doc Processor)</option>
                </select>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px', padding: '12px' }} disabled={loading}>
            {loading ? 'Đang xử lý...' : isLoginMode ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>

        <div style={{ marginTop: '18px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <button
            type="button"
            className="btn btn-link"
            style={{ color: 'inherit', textDecoration: 'underline', cursor: 'pointer', padding: '0', background: 'none', border: 'none' }}
            onClick={() => setIsLoginMode(!isLoginMode)}
          >
            {isLoginMode ? 'Chưa có tài khoản? Đăng ký tại đây' : 'Đã có tài khoản? Quay lại đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}