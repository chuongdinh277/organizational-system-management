package com.seminar.logistics.controller;

import com.seminar.logistics.model.Account;
import com.seminar.logistics.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Đảm bảo Frontend Vite gọi sang không bị lỗi CORS[cite: 8]
public class AuthController {

    @Autowired
    private AccountRepository accountRepository;

    // 1. XỬ LÝ ĐĂNG NHẬP[cite: 8]
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.get("username"); //[cite: 8]
        String password = request.get("password"); //[cite: 8]
        Optional<Account> accountOpt = accountRepository.findById(username); //[cite: 8]

        if (accountOpt.isPresent() && accountOpt.get().getPassword().equals(password)) { //[cite: 8]
            Account acc = accountOpt.get(); //[cite: 8]
            return ResponseEntity.ok(Map.of( //[cite: 8]
                "username", acc.getUsername(), //[cite: 8]
                "role", acc.getRole(), //[cite: 8]
                "fullName", acc.getFullName(), //[cite: 8]
                "status", "SUCCESS" //[cite: 8]
            ));
        }

        return ResponseEntity.status(401).body("Tên đăng nhập hoặc mật khẩu không chính xác!"); //[cite: 8]
    }

    // 2. XỬ LÝ ĐĂNG KÝ (Bổ sung mới)
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        String fullName = request.get("fullName");
        String role = request.get("role"); // Gồm các quyền: Role_Admin_Logistics, Role_Reservation, Role_Doc_Processor[cite: 2, 6]

        // Kiểm tra xem username đã tồn tại trong DB chưa
        if (accountRepository.existsById(username)) {
            return ResponseEntity.badRequest().body("Tên đăng nhập này đã tồn tại trên hệ thống!");
        }

        // Tạo đối tượng Account mới để lưu vào MySQL
        Account newAccount = new Account();
        newAccount.setUsername(username);
        newAccount.setPassword(password); // Lưu chuỗi thô để nhóm test nhanh
        newAccount.setFullName(fullName);
        newAccount.setRole(role != null ? role : "Role_Reservation"); // Nếu không chọn role, mặc định là bộ phận Đặt chỗ[cite: 2]

        accountRepository.save(newAccount);
        return ResponseEntity.status(HttpStatus.CREATED).body("Đăng ký tài khoản thành công!");
    }
}