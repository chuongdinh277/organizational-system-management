package com.seminar.logistics.model;

import com.seminar.logistics.security.AesEncryptor;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "experts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Expert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Convert(converter = AesEncryptor.class)
    @Column(name = "passport_no", nullable = false, length = 1000) // Increase length to support Base64 output of AES encryption
    private String passportNo;
}
