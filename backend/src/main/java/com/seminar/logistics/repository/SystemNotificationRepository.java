package com.seminar.logistics.repository;

import com.seminar.logistics.model.SystemNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SystemNotificationRepository extends JpaRepository<SystemNotification, Long> {
    List<SystemNotification> findAllByOrderByCreatedAtDesc();

    @Query("""
            select n from SystemNotification n
            where n.targetRole is null or n.targetRole = 'ALL' or n.targetRole = :role
            order by n.createdAt desc
            """)
    List<SystemNotification> findVisibleForRole(@Param("role") String role);
}
