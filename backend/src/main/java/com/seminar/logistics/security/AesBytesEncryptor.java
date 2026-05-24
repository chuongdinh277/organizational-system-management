package com.seminar.logistics.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;

@Converter
@Component
public class AesBytesEncryptor implements AttributeConverter<byte[], byte[]> {

    private static final String ALGORITHM = "AES";
    private static String secretKey = "SeminarSystemSecretKey2026AES256";

    @Value("${app.aes.key:SeminarSystemSecretKey2026AES256}")
    public void setSecretKey(String key) {
        if (key != null && key.length() == 32) {
            secretKey = key;
        }
    }

    @Override
    public byte[] convertToDatabaseColumn(byte[] attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec);
            return cipher.doFinal(attribute);
        } catch (Exception e) {
            throw new RuntimeException("Encryption of file failed", e);
        }
    }

    @Override
    public byte[] convertToEntityAttribute(byte[] dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, keySpec);
            return cipher.doFinal(dbData);
        } catch (Exception e) {
            throw new RuntimeException("Decryption of file failed", e);
        }
    }
}
