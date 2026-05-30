const apiBaseUrl = "/api/material-shipments";

const shipmentForm = document.querySelector("#shipmentForm");
const shipmentRows = document.querySelector("#shipmentRows");
const messageBox = document.querySelector("#message");
const refreshButton = document.querySelector("#refreshButton");

const statusLabels = {
  NEW: "Mới tạo",
  PROCESSING_LOGISTICS: "Đang xử lý hậu cần",
  VENUE_CONFIRMED: "Đã chốt địa điểm",
  MATERIALS_ALERTED: "Cần làm tài liệu",
  MATERIALS_CALCULATED: "Đã tính ấn phẩm",
  TRANSPORT_SLIP_CREATED: "Đã tạo phiếu vận chuyển",
  MATERIALS_SHIPPED: "Đã gửi hàng",
  VENUE_RECEIVED: "Địa điểm đã nhận",
  READY_TO_ORGANIZE: "Sẵn sàng tổ chức",
};

function showMessage(text) {
  messageBox.textContent = text;
  messageBox.hidden = false;
}

function readFormData() {
  const formData = new FormData(shipmentForm);
  return {
    seminarType: formData.get("seminarType"),
    seminarDate: formData.get("seminarDate"),
    seminarCity: formData.get("seminarCity"),
    anticipatedRegistrantCount: Number(formData.get("anticipatedRegistrantCount")),
    registeredParticipantCount: Number(formData.get("registeredParticipantCount")),
    venueName: formData.get("venueName"),
    venueAddress: formData.get("venueAddress"),
    materialUnitRequirements: {
      "Sách tài liệu": 1,
      "Tờ rơi": 2,
      "Thẻ tên": 1,
      "Bút viết": 1,
    },
  };
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `HTTP ${response.status}`);
  }
  return response.json();
}

async function loadShipments() {
  const shipments = await requestJson(apiBaseUrl);
  if (shipments.length === 0) {
    shipmentRows.innerHTML = '<tr><td colspan="6">Chưa có hồ sơ nào.</td></tr>';
    return;
  }
  shipmentRows.innerHTML = shipments.map(renderShipmentRow).join("");
}

function renderShipmentRow(shipment) {
  const statusText = statusLabels[shipment.status] || shipment.status;
  const statusClass = shipment.status === "READY_TO_ORGANIZE" ? "done" : "alert";
  const alertText = shipment.materialPreparationAlert ? "Có" : "Không";
  return `
    <tr>
      <td>${shipment.workflowId}</td>
      <td>${shipment.seminarType}<br><small>${shipment.venueName}</small></td>
      <td>${shipment.seminarDate}<br><small>${shipment.seminarCity}</small></td>
      <td>${alertText}</td>
      <td><span class="status ${statusClass}">${statusText}</span></td>
      <td>
        <div class="actions">
          <button type="button" data-action="calculate" data-id="${shipment.workflowId}">Tính</button>
          <a href="${apiBaseUrl}/${shipment.workflowId}/transport-slip.pdf" target="_blank">Phiếu PDF</a>
          <button class="warning" type="button" data-action="ship" data-id="${shipment.workflowId}">Báo gửi</button>
          <button class="secondary" type="button" data-action="receive" data-id="${shipment.workflowId}">Đã nhận</button>
          <button class="success" type="button" data-action="complete" data-id="${shipment.workflowId}">Hoàn tất</button>
        </div>
      </td>
    </tr>
  `;
}

async function createShipment(event) {
  event.preventDefault();
  const shipment = await requestJson(apiBaseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(readFormData()),
  });
  showMessage(`Đã tạo hồ sơ ${shipment.workflowId}.`);
  await loadShipments();
}

async function handleActionClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const workflowId = button.dataset.id;
  const action = button.dataset.action;

  if (action === "calculate") {
    const result = await requestJson(`${apiBaseUrl}/${workflowId}/calculate-materials`, { method: "POST" });
    showMessage(`Đã tính số lượng:\n${JSON.stringify(result.materialQuantities, null, 2)}`);
  }

  if (action === "ship") {
    await requestJson(`${apiBaseUrl}/${workflowId}/shipping-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shipmentTrackingCode: `VC-${Date.now()}` }),
    });
    showMessage("Đã ghi nhận bộ phận tài liệu gửi hàng.");
  }

  if (action === "receive") {
    await requestJson(`${apiBaseUrl}/${workflowId}/venue-delivery-confirmation`, { method: "POST" });
    showMessage("Đã xác nhận địa điểm nhận tài liệu.");
  }

  if (action === "complete") {
    await requestJson(`${apiBaseUrl}/${workflowId}/complete`, { method: "POST" });
    showMessage("Đã đóng quy trình, sẵn sàng tổ chức.");
  }

  await loadShipments();
}

shipmentForm.addEventListener("submit", (event) => {
  createShipment(event).catch((error) => showMessage(error.message));
});

shipmentRows.addEventListener("click", (event) => {
  handleActionClick(event).catch((error) => showMessage(error.message));
});

refreshButton.addEventListener("click", () => {
  loadShipments().catch((error) => showMessage(error.message));
});

loadShipments().catch((error) => showMessage(error.message));
