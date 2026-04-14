// ============================================
// DELIVERY CONTROLLER - Xử lý events giao thuốc
// ============================================

import deliveryService from "../services/deliveryService.js";
import patientService from "../services/patientService.js";
import { renderDeliveryView } from "../views/deliveryView.js";
import { showToast } from "../utils/ui.js";
import firebaseService from "../services/firebaseService.js";

class DeliveryController {
  constructor() {
    this.viewContainer = document.getElementById("view-delivery");
    this.unsubscribeDeliveryCommands = null;
    // Tự động render lại khi stateService thay đổi (chỉ khi đang ở tab giao thuốc)
    import("../services/stateService.js").then(({ default: stateService }) => {
      stateService.subscribe(() => {
        // Chỉ render nếu view đang hiển thị delivery
        if (this.viewContainer && this.viewContainer.offsetParent !== null) {
          this.renderView();
        }
      });
    });
  }

  init() {
    // Render sẽ được gọi khi switch view
    // Lắng nghe realtime trạng thái đơn hàng
    if (this.unsubscribeDeliveryCommands) this.unsubscribeDeliveryCommands();
    this.unsubscribeDeliveryCommands = firebaseService.listenDeliveryCommandsRealtime((commands) => {
      // Kiểm tra có đơn hàng nào đang delivering không
      const hasDelivering = commands.some(cmd => cmd.status === "delivering");
      window.isDelivering = hasDelivering;
      this.renderView();
      // Lấy state hiện tại
      const state = deliveryService.getDeliveryBins();
      let updated = false;
      // Duyệt từng ngăn, nếu có đơn hàng slot tương ứng và status là 'thành công' thì giải phóng ngăn
      commands.forEach(cmd => {
        if (cmd.status === "thành công" && cmd.slot) {
          const slotIdx = Number(cmd.slot) - 1;
          if (state[slotIdx] && state[slotIdx].status === "đang giao") {
            state[slotIdx] = { patientId: "", note: "", status: "" };
            updated = true;
          }
        }
      });
      if (updated) {
        // Lưu lại state và render lại UI
        deliveryService.saveBins(state);
        this.renderView();
      }
    });
  }

  renderView() {
    // --- Lưu trạng thái focus và vị trí con trỏ của textarea (nếu có) ---
    const active = document.activeElement;
    let noteFocusIndex = null;
    let selectionStart = null;
    let selectionEnd = null;
    if (active && active.classList && active.classList.contains("delivery-control-note")) {
      noteFocusIndex = active.dataset.index;
      selectionStart = active.selectionStart;
      selectionEnd = active.selectionEnd;
    }

    const bins = deliveryService.getDeliveryBins();
    const patients = patientService.getPatients();
    const readyBinsCount = deliveryService.getReadyBinsCount();

    // Kiểm tra trạng thái đơn hàng trên Firestore (giả sử lưu vào this.isDelivering)
    const isDelivering = window.isDelivering || false;
    renderDeliveryView(this.viewContainer, bins, patients, readyBinsCount, isDelivering);

    // Setup event listeners
    this.setupEventListeners();

    // --- Khôi phục focus và vị trí con trỏ nếu vừa nhập note ---
    if (noteFocusIndex !== null) {
      const newTextarea = this.viewContainer.querySelector(`.delivery-control-note[data-index='${noteFocusIndex}']`);
      if (newTextarea) {
        newTextarea.focus();
        if (selectionStart !== null && selectionEnd !== null) {
          newTextarea.setSelectionRange(selectionStart, selectionEnd);
        }
      }
    }
  }

  setupEventListeners() {
    // Chỉ lấy bệnh nhân đang nhập viện
    const patients = patientService.getPatients().filter(p => p.status === 'admitted');
    const bins = deliveryService.getDeliveryBins();

    // Patient search controls - modal (stepper: lầu -> phòng -> bệnh nhân)
    this.viewContainer.querySelectorAll(".delivery-control-patient-search").forEach((input) => {
      const index = Number(input.dataset.index);
      const hiddenInput = this.viewContainer.querySelector(`.delivery-control-patient-id[data-index="${index}"]`);
      const currentPatientId = bins[index].patientId;
      const isBusy = bins[index].status === "đang giao";
      if (currentPatientId) {
        const patient = patients.find(p => String(p.id) === String(currentPatientId));
        if (patient) {
          input.value = patient.name;
          hiddenInput.value = currentPatientId;
        }
      }
      if (isBusy) return;
      input.addEventListener("click", () => {
        const modal = document.getElementById("patient-select-modal");
        if (!modal) return;
        import('../services/roomService.js').then(roomServiceModule => {
          roomServiceModule.default.getRooms().then(allRooms => {
            // Lấy danh sách lầu và phòng
            const allRoomNames = allRooms.map(r => r.name).filter(Boolean);
            // Lấy số đầu tiên của tên phòng làm lầu (101, 102, 105 đều là Lầu 1)
            const getFloorNumber = (roomName) => {
              if (!roomName) return 0;
              const match = String(roomName).match(/^(\d)/);
              return match ? parseInt(match[1]) : 0;
            };
            // Danh sách lầu duy nhất, tăng dần
            const floorNumbers = Array.from(new Set(allRoomNames.map(getFloorNumber))).filter(n => n > 0).sort((a, b) => a - b);
            const floors = floorNumbers.map(n => `Lầu ${n}`);
            // Hàm lấy số lầu từ string "Lầu 1"
            const getFloorFromLabel = (label) => parseInt(label.replace(/\D/g, ""));
            let step = 1;
            let selectedFloor = null;
            let selectedRoom = null;
            // Render stepper UI
            function renderStepper() {
              modal.querySelectorAll('.stepper-step').forEach((el, idx) => {
                const circle = el.querySelector('.step-circle');
                const label = el.querySelector('.step-label');
                if (idx+1 === step) {
                  circle.style.background = '#2563eb';
                  circle.style.color = '#fff';
                  label.style.color = '#222';
                  label.style.fontWeight = '600';
                  circle.style.boxShadow = '0 2px 8px #2563eb22';
                } else {
                  circle.style.background = '#f3f4f6';
                  circle.style.color = '#bbb';
                  label.style.color = '#bbb';
                  label.style.fontWeight = '500';
                  circle.style.boxShadow = 'none';
                }
              });
            }
            // Render nội dung từng bước
            function renderStepContent() {
              renderStepper();
              const content = modal.querySelector('#patient-step-content');
              if (step === 1) {
                content.innerHTML = `
                  <div style='font-size:18px;font-weight:600;margin-bottom:18px;'>Chọn lầu</div>
                  <div style='display:flex;flex-wrap:wrap;gap:24px;'>
                    ${floors.map(f => {
                      const floorNum = getFloorFromLabel(f);
                      const count = allRoomNames.filter(r => getFloorNumber(r) === floorNum).length;
                      return `<div class='floor-card' data-floor='${f}' style='flex:1 1 180px;min-width:160px;max-width:220px;cursor:pointer;background:#f8fbff;border-radius:14px;padding:24px 18px;box-shadow:0 2px 12px #2563eb11;display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px solid #e5eaf2;transition:.2s;'>
                        <div style='font-size:22px;font-weight:700;color:#2563eb;margin-bottom:8px;'>${f}</div>
                        <div style='font-size:15px;color:#888;'>${count} phòng</div>
                      </div>`;
                    }).join('')}
                  </div>
                `;
                // Gán event chọn lầu
                content.querySelectorAll('.floor-card').forEach(card => {
                  card.onclick = () => {
                    selectedFloor = card.getAttribute('data-floor');
                    step = 2;
                    renderStepContent();
                  };
                });
              } else if (step === 2) {
                const selectedFloorNum = getFloorFromLabel(selectedFloor);
                let filteredRooms = allRoomNames.filter(r => getFloorNumber(r) === selectedFloorNum);
                // Sắp xếp phòng tăng dần
                filteredRooms = filteredRooms.sort((a, b) => {
                  const numA = parseInt(a.replace(/\D/g, "")) || 0;
                  const numB = parseInt(b.replace(/\D/g, "")) || 0;
                  return numA - numB;
                });
                content.innerHTML = `
                  <button id='step-back' style='margin-bottom:12px;background:none;border:none;color:#2563eb;font-size:16px;cursor:pointer;'>&lt; Quay lại</button>
                  <div style='font-size:18px;font-weight:600;margin-bottom:18px;'>Chọn phòng (${selectedFloor})</div>
                  <div style='display:flex;flex-wrap:wrap;gap:18px;'>
                    ${filteredRooms.map(r => `<div class='room-card' data-room='${r}' style='flex:1 1 120px;min-width:100px;max-width:160px;cursor:pointer;background:#fff;border-radius:12px;padding:18px 10px;box-shadow:0 2px 8px #2563eb11;display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px solid #e5eaf2;transition:.2s;'>
                      <div style='font-size:18px;font-weight:700;color:#2563eb;margin-bottom:4px;'>${r}</div>
                      <div style='font-size:14px;color:#888;'>${patients.filter(p=>p.room===r).length} bệnh nhân</div>
                    </div>`).join('')}
                  </div>
                `;
                // Back
                content.querySelector('#step-back').onclick = () => {
                  step = 1;
                  renderStepContent();
                };
                // Gán event chọn phòng
                content.querySelectorAll('.room-card').forEach(card => {
                  card.onclick = () => {
                    selectedRoom = card.getAttribute('data-room');
                    step = 3;
                    renderStepContent();
                  };
                });
              } else if (step === 3) {
                const filteredPatients = patients.filter(p => p.room === selectedRoom);
                content.innerHTML = `
                  <button id='step-back' style='margin-bottom:12px;background:none;border:none;color:#2563eb;font-size:16px;cursor:pointer;'>&lt; Quay lại</button>
                  <div style='font-size:18px;font-weight:600;margin-bottom:18px;'>Chọn bệnh nhân (Phòng ${selectedRoom})</div>
                  <input id='patient-search' type='text' placeholder='Tìm tên, mã, giường...' style='width:100%;margin-bottom:12px;padding:8px 12px;font-size:1rem;border-radius:8px;border:1px solid #e5eaf2;'>
                  <div id='patient-list' style='max-height:320px;overflow-y:auto;'>
                    ${filteredPatients.map(p => `<div class='patient-card' data-id='${p.id}' style='display:flex;align-items:center;gap:16px;padding:12px 8px;cursor:pointer;border-bottom:1px solid #f0f4fa;transition:background .15s;'>
                      <div style='width:38px;height:38px;border-radius:50%;background:#e5eaf2;display:flex;align-items:center;justify-content:center;font-weight:700;color:#2563eb;font-size:18px;'>${(p.name||'')[0]}</div>
                      <div style='flex:1;'>
                        <div style='font-size:16px;font-weight:700;'>${p.name}</div>
                        <div style='font-size:13px;color:#888;'>Giường ${p.bed||''}</div>
                      </div>
                    </div>`).join('') || '<div style="color:#888;padding:18px 0;">Không có bệnh nhân trong phòng này</div>'}
                  </div>
                `;
                // Back
                content.querySelector('#step-back').onclick = () => {
                  step = 2;
                  renderStepContent();
                };
                // Search
                const searchInput = content.querySelector('#patient-search');
                searchInput.oninput = (e) => {
                  const q = e.target.value.toLowerCase();
                  const filtered = filteredPatients.filter(p =>
                    (p.name||'').toLowerCase().includes(q) ||
                    (p.id||'').toLowerCase().includes(q) ||
                    (p.bed||'').toLowerCase().includes(q)
                  );
                  const list = content.querySelector('#patient-list');
                  list.innerHTML = filtered.map(p => `<div class='patient-card' data-id='${p.id}' style='display:flex;align-items:center;gap:16px;padding:12px 8px;cursor:pointer;border-bottom:1px solid #f0f4fa;transition:background .15s;'>
                      <div style='width:38px;height:38px;border-radius:50%;background:#e5eaf2;display:flex;align-items:center;justify-content:center;font-weight:700;color:#2563eb;font-size:18px;'>${(p.name||'')[0]}</div>
                      <div style='flex:1;'>
                        <div style='font-size:16px;font-weight:700;'>${p.name}</div>
                        <div style='font-size:13px;color:#888;'>Giường ${p.bed||''}</div>
                      </div>
                    </div>`).join('') || '<div style="color:#888;padding:18px 0;">Không có bệnh nhân trong phòng này</div>';
                  // Gán lại event chọn
                  list.querySelectorAll('.patient-card').forEach(card => {
                    card.onclick = () => {
                      const id = card.getAttribute('data-id');
                      const patient = patients.find(p => String(p.id) === String(id));
                      if (patient) {
                        const result = deliveryService.updateBin(index, "patientId", patient.id);
                        if (!result.success) {
                          showToast(result.message);
                          this.renderView();
                          return;
                        }
                        input.value = patient.name;
                        hiddenInput.value = patient.id;
                        modal.style.display = "none";
                        this.updateReadyState();
                      }
                    };
                  });
                };
                // Gán event chọn bệnh nhân
                content.querySelectorAll('.patient-card').forEach(card => {
                  card.onclick = () => {
                    const id = card.getAttribute('data-id');
                    const patient = patients.find(p => String(p.id) === String(id));
                    if (patient) {
                      const result = deliveryService.updateBin(index, "patientId", patient.id);
                      if (!result.success) {
                        showToast(result.message);
                        this.renderView();
                        return;
                      }
                      input.value = patient.name;
                      hiddenInput.value = patient.id;
                      modal.style.display = "none";
                      // Gọi updateReadyState qua instance controller
                      if (window.deliveryControllerInstance) {
                        window.deliveryControllerInstance.updateReadyState();
                      }
                    }
                  };
                    // Đảm bảo có thể gọi updateReadyState từ callback
                    if (!window.deliveryControllerInstance) {
                      window.deliveryControllerInstance = this;
                    }
                });
              }
            }
            renderStepContent();
            // Đóng modal
            modal.querySelector('#patient-modal-cancel').onclick = () => {
              modal.style.display = "none";
            };
          });
        });
        modal.style.display = "flex";
      });
    });

    // Note textarea controls
    this.viewContainer.querySelectorAll(".delivery-control-note").forEach((textarea) => {
      const index = Number(textarea.dataset.index);
      textarea.value = deliveryService.getDeliveryBins()[index].note || "";
      const isBusy = bins[index].status === "đang giao";
      if (isBusy) return; // KHÔNG cho thao tác nếu đang giao
      textarea.addEventListener("input", (e) => {
        // Only update state and DOM, do not re-render the whole view
        const result = deliveryService.updateBin(index, "note", e.target.value, false);
        if (!result.success) {
          showToast(result.message);
          // Only re-render if error (rare)
          this.renderView();
          return;
        }
        // Update the textarea value directly in DOM (in case of programmatic changes)
        if (textarea.value !== e.target.value) {
          textarea.value = e.target.value;
        }
        this.updateReadyState();
      });
    });

    // Clear bin buttons
    this.viewContainer.querySelectorAll(".clear-bin-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.index);
        const result = deliveryService.clearBin(index);
        if (result.success) {
          showToast(result.message);
          this.renderView();
        } else {
          showToast(result.message);
        }
      });
    });

    // Cancel patient select buttons
    this.viewContainer.querySelectorAll(".cancel-patient-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.index);
        // Xoá patientId khỏi bin
        const result = deliveryService.updateBin(index, "patientId", "");
        if (result.success) {
          showToast("Đã huỷ chọn bệnh nhân.");
          this.renderView();
        } else {
          showToast(result.message);
        }
      });
    });

    // Start mission button
    const startBtn = this.viewContainer.querySelector("#start-delivery-btn");
    if (startBtn) {
      startBtn.addEventListener("click", async () => {
        const result = await deliveryService.startMission();
        if (result.success) {
          showToast(result.message);
          import('../utils/ui.js').then(m => m.showSuccessCheckmark());
          this.renderView();
        } else {
          showToast(result.message);
        }
      });
    }
  }

  updateReadyState() {
    const readyCount = deliveryService.getReadyBinsCount();
    const readyText = this.viewContainer.querySelector("#ready-bins-text");
    const startBtn = this.viewContainer.querySelector("#start-delivery-btn");

    if (readyText) {
      readyText.textContent = `${readyCount} ngăn đã sẵn sàng`;
    }

    if (startBtn) {
      startBtn.disabled = !readyCount;
    }
  }
}

export default new DeliveryController();
