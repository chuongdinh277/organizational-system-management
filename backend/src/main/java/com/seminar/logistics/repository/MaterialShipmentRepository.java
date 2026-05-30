package com.seminar.logistics.repository;

import com.seminar.logistics.model.MaterialShipment;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Repository;

@Repository
public class MaterialShipmentRepository {
  private final Map<String, MaterialShipment> materialShipments = new ConcurrentHashMap<>();

  /** Lưu hồ sơ vận chuyển tài liệu vào bộ nhớ tạm. */
  public MaterialShipment save(MaterialShipment materialShipment) {
    materialShipments.put(materialShipment.getWorkflowId(), materialShipment);
    return materialShipment;
  }

  /** Tìm hồ sơ vận chuyển tài liệu theo mã. */
  public Optional<MaterialShipment> findById(String workflowId) {
    return Optional.ofNullable(materialShipments.get(workflowId));
  }

  /** Lấy toàn bộ hồ sơ vận chuyển tài liệu. */
  public List<MaterialShipment> findAll() {
    return new ArrayList<>(materialShipments.values());
  }
}
