import { useState } from 'react';

export function useAuth(onLoginSuccess) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Role_Reservation');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setLoading(true);

    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
    const payload = isLoginMode ? { username, password } : { username, password, fullName, role };

    // ========================================================
    // ĐOẠN CODE IN THÔNG TIN ĐÃ NHẬP ĐỂ TEST LỖI
    // ========================================================
    console.log("%c--- THÔNG TIN ĐÃ NHẬP PHÍA FRONTEND ---", "color: #3b82f6; font-weight: bold; font-size: 12px;");
    console.log("Chế độ hiện tại:", isLoginMode ? "ĐĂNG NHẬP" : "ĐĂNG KÝ");
    console.log("Đường dẫn API (Endpoint):", endpoint);
    console.log("Dữ liệu gửi đi (Payload):", payload);
    console.log("-----------------------------------------");
    // ========================================================

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resText = await response.text();

      if (response.ok) {
        if (isLoginMode) {
          onLoginSuccess && onLoginSuccess(JSON.parse(resText));
        } else {
          setMessage({ text: 'Đăng ký thành công! Hãy đăng nhập.', type: 'success' });
          setIsLoginMode(true);
          setUsername('');
          setPassword('');
          setFullName('');
        }
      } else {
        // In thêm log phản hồi thất bại từ Backend để phân tích lý do
        console.error(`Backend trả về mã lỗi: ${response.status}. Nội dung lỗi: ${resText}`);
        setMessage({ text: resText || 'Thông tin xác thực không chính xác!', type: 'error' });
      }
    } catch (err) {
      console.error("Lỗi kết nối nghiêm trọng:", err);
      setMessage({ text: 'Không thể kết nối đến máy chủ Backend!', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return {
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
    handleSubmit,
    setMessage
  };
}

export default useAuth;