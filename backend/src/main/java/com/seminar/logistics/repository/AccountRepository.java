package com.seminar.logistics.repository;

import com.seminar.logistics.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, String> {
    // Hàm tìm kiếm tài khoản dựa vào tên đăng nhập (username) phục vụ cho logic check login
    Optional<Account> findByUsername(String username);
}