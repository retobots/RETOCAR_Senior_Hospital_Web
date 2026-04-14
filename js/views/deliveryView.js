// ============================================
// DELIVERY VIEW - Render UI giao thuốc
// ============================================

import authService from "../services/authService.js";

export function renderDeliveryView(container, deliveryBins, patients, readyBinsCount, isDelivering) {
  const canEditDelivery = authService.can("delivery.edit");
  const canStartDelivery = authService.can("delivery.start");

  // Modal chọn bệnh nhân dạng stepper: Lầu -> Phòng -> Bệnh nhân
  const patientModal = `
    <div id="patient-select-modal" class="modal-overlay" style="display:none;z-index:1000;align-items:center;justify-content:center;">
      <div class="modal-card" style="max-width:980px;min-width:520px;width:96vw;height:88vh;padding:24px 28px 18px 28px;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-start;">
        <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:80px;height:7px;background:#ff6600;border-radius:6px 6px 12px 12px;margin-bottom:8px;"></div>
        <h3 style="font-size:2.1rem;font-weight:800;margin-bottom:10px;margin-top:10px;z-index:1;position:relative;text-align:center;">Chọn bệnh nhân</h3>
        <div class="stepper" style="display:flex;align-items:center;gap:40px;margin:18px 0 18px 0;justify-content:center;z-index:1;position:relative;">
          <div class="stepper-step" data-step="1" style="display:flex;align-items:center;gap:14px;">
            <span class="step-circle" style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#2563eb;color:#fff;font-weight:700;font-size:22px;box-shadow:0 2px 8px #2563eb22;">1</span>
            <span class="step-label" style="font-weight:700;color:#222;font-size:19px;">Chọn lầu</span>
          </div>
          <div class="stepper-line" style="flex:0 0 60px;height:2.5px;background:#e5eaf2;"></div>
          <div class="stepper-step" data-step="2" style="display:flex;align-items:center;gap:14px;">
            <span class="step-circle" style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#f3f4f6;color:#bbb;font-weight:700;font-size:22px;">2</span>
            <span class="step-label" style="font-weight:600;color:#bbb;font-size:19px;">Chọn phòng</span>
          </div>
          <div class="stepper-line" style="flex:0 0 60px;height:2.5px;background:#e5eaf2;"></div>
          <div class="stepper-step" data-step="3" style="display:flex;align-items:center;gap:14px;">
            <span class="step-circle" style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#f3f4f6;color:#bbb;font-weight:700;font-size:22px;">3</span>
            <span class="step-label" style="font-weight:600;color:#bbb;font-size:19px;">Chọn bệnh nhân</span>
          </div>
        </div>
        <div id="patient-step-content"></div>
        <div style="text-align:right;margin-top:18px;">
          <button id="patient-modal-cancel" class="ghost-btn" type="button" style="font-size:1.1rem;padding:8px 22px;">Đóng</button>
        </div>
      </div>
    </div>
  `;

  const compartments = deliveryBins
    .map((bin, index) => {
      const patient = patients.find((p) => String(p.id) === String(bin.patientId));
      const hasAssigned = Boolean(bin.patientId && bin.note.trim());
      // Nếu đang có đơn hàng delivering thì tất cả ngăn đều bị khóa
      const isBusy = isDelivering || bin.status === "delivering";
      const statusLabel = isBusy ? "Đang giao hàng..." : (hasAssigned ? "Đã gán" : "Trống");

      return `

      <div class="card delivery-compartment${hasAssigned ? " assigned" : ""}${isBusy ? " slot-busy" : ""}">
        <div class="delivery-head">
          <div>
            <h3>Ngăn ${index + 1}</h3>
            <p>${statusLabel}</p>
          </div>
        </div>

        <div class="field-wrap">
          <label>Chọn bệnh nhân</label>
          <div class="patient-search-wrapper" style="display:flex;align-items:center;gap:8px;">
            <input 
              type="text" 
              class="delivery-control-patient-search" 
              data-index="${index}" 
              placeholder="Nhấn để chọn bệnh nhân..." 
              readonly
              style="cursor:pointer;background:#f3f4f6;"
              ${(canEditDelivery && !isBusy) ? "" : "disabled"} />
            <input type="hidden" class="delivery-control-patient-id" data-index="${index}" value="${bin.patientId}">
            ${bin.patientId && canEditDelivery && !isBusy ? `<button class="ghost-btn cancel-patient-btn" data-index="${index}" title="Huỷ chọn" style="border:1.5px solid #f87171;color:#f87171;background:#fff;padding:4px 12px;border-radius:8px;font-size:0.98rem;font-weight:600;">Huỷ</button>` : ""}
          </div>
        </div>

        <div class="field-wrap">
          <label>Hướng dẫn giao thuốc</label>
          <textarea class="delivery-control-note" data-index="${index}" rows="3" placeholder="Ví dụ: Sau ăn, cần hỗ trợ, uống kèm nước..." ${(canEditDelivery && !isBusy) ? "" : "disabled"}></textarea>
        </div>
        ${isBusy ? `<div class='delivery-busy-label'><span class="spinner"></span>Đang giao hàng...</div>` : ""}
        ${patient ? (() => {
          let bedNum = patient.bed;
          if (typeof bedNum === 'string') {
            const match = bedNum.match(/\d+/);
            bedNum = match ? match[0] : bedNum;
          }
          return `<div class="delivery-preview"><strong>${patient.name}</strong><span>Phòng ${patient.room}, Giường ${bedNum}</span></div>`;
        })() : ""}
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
    ${patientModal}
  `;
}
