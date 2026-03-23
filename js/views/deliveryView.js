// ============================================
// DELIVERY VIEW - Render UI giao thuốc
// ============================================

import authService from "../services/authService.js";

export function renderDeliveryView(container, deliveryBins, patients, readyBinsCount) {
  const canEditDelivery = authService.can("delivery.edit");
  const canStartDelivery = authService.can("delivery.start");

  const compartments = deliveryBins
    .map((bin, index) => {
      const patient = patients.find((p) => String(p.id) === String(bin.patientId));
      const hasAssigned = Boolean(bin.patientId && bin.note.trim());
      const statusLabel = hasAssigned ? "Đã gán" : "Trống";

      return `
      <div class="card delivery-compartment ${hasAssigned ? "assigned" : ""}">
        <div class="delivery-head">
          <div>
            <h3>Ngăn ${index + 1}</h3>
            <p>${statusLabel}</p>
          </div>
          ${hasAssigned || bin.note ? `<button class="link-clear clear-bin-btn" data-index="${index}" ${canEditDelivery ? "" : "disabled title='Không có quyền xóa dữ liệu ngăn'"}>Xóa</button>` : ""}
        </div>

        <div class="field-wrap">
          <label>Chọn bệnh nhân</label>
          <div class="patient-search-wrapper">
            <input 
              type="text" 
              class="delivery-control-patient-search" 
              data-index="${index}" 
              placeholder="Nhập tên bệnh nhân..." 
              autocomplete="off"
              ${canEditDelivery ? "" : "disabled"} />
            <div class="patient-dropdown-list" data-index="${index}"></div>
          </div>
          <input type="hidden" class="delivery-control-patient-id" data-index="${index}" value="${bin.patientId}">
        </div>

        <div class="field-wrap">
          <label>Hướng dẫn giao thuốc</label>
          <textarea class="delivery-control-note" data-index="${index}" rows="3" placeholder="Ví dụ: Sau ăn, cần hỗ trợ, uống kèm nước..." ${canEditDelivery ? "" : "disabled"}></textarea>
        </div>

        ${patient ? `<div class="delivery-preview"><strong>${patient.name}</strong><span>Room ${patient.room}, Bed ${patient.bed}</span></div>` : ""}
      </div>
    `;
    })
    .join("");

  container.innerHTML = `
    <div class="section-head">
      <div>
        <h2>Ngăn thuốc robot</h2>
        <p>Chỉ gửi lệnh khi đã chọn bệnh nhân và nhập ghi chú cho ngăn thuốc</p>
      </div>
    </div>

    <div class="delivery-grid">${compartments}</div>

    <div class="card delivery-footer">
      <div>
        <h3>Sẵn sàng giao thuốc?</h3>
        <p id="ready-bins-text">${readyBinsCount} ngăn đã sẵn sàng</p>
      </div>
      <button id="start-delivery-btn" ${(readyBinsCount && canStartDelivery) ? "" : "disabled"} ${canStartDelivery ? "" : "title='Không có quyền gửi lệnh giao thuốc'"}><i class="fa-regular fa-paper-plane" aria-hidden="true"></i><span>Bắt đầu nhiệm vụ</span></button>
    </div>
  `;
}
