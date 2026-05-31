package com.seminar.logistics.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account {

    @Id
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, length = 255)
    private String password;

    // SỬA ĐOẠN NÀY: Thêm name = "full_name" để ánh xạ chuẩn xác với MySQL
    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false, length = 30)
    private String role; // "ADMIN" (Người điều phối) hoặc "DAT_CHO" (Bộ phận đăng ký)
}