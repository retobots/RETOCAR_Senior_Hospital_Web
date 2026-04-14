// ============================================
// PATIENT CONTROLLER - Xử lý events bệnh nhân
// ============================================

import patientService from "../services/patientService.js";
import roomController from "./roomController.js";
import stateService from "../services/stateService.js";
import { renderPatientView } from "../views/patientView.js";
import { showToast, setupModalClose, focusFirstInputInModal } from "../utils/ui.js";
import roomService from "../services/roomService.js";

class PatientController {
  constructor() {
    this.viewContainer = document.getElementById("view-patients");
    this.isModalVisible = false;
    this.editingPatient = null;
    this.filters = { status: "all", room: "" };

    // Khi khởi tạo, luôn đồng bộ dữ liệu từ Firestore
    this.initSyncFromCloud();

    // Subscribe để tự động render khi state thay đổi
    stateService.subscribe(() => {
      this.renderView();
    });
  }

  async initSyncFromCloud() {
    // Chỉ đồng bộ nếu đang ở view bệnh nhân
    if (this.viewContainer) {
      await patientService.syncPatientsFromCloud();
    }
  }

  init() {
    // Render sẽ được gọi khi switch view
  }

  renderView(searchQuery = "") {
    // Lọc bệnh nhân
    const filteredPatients = patientService.filterPatients({
      status: this.filters.status,
      room: this.filters.room,
      search: searchQuery,
    });

    // Render view
    renderPatientView(this.viewContainer, filteredPatients, this.isModalVisible, this.editingPatient);

    // Setup event listeners
    this.setupEventListeners();

    // Gán event cho nút phân trang sau khi render
    const pag = this.viewContainer.querySelector('#patient-pagination');
    if (pag) {
      pag.querySelector('#first-page').onclick = () => { window.patientPage = 1; this.renderView(); };
      pag.querySelector('#prev-page').onclick = () => { window.patientPage = Math.max(1, window.patientPage-1); this.renderView(); };
      pag.querySelector('#next-page').onclick = () => {
        const totalPages = Math.ceil(patientService.filterPatients(this.filters).length / 10) || 1;
        window.patientPage = Math.min(totalPages, window.patientPage+1); this.renderView();
      };
      pag.querySelector('#last-page').onclick = () => {
        const totalPages = Math.ceil(patientService.filterPatients(this.filters).length / 10) || 1;
        window.patientPage = totalPages; this.renderView();
      };
    }
  }

  setupEventListeners() {
    // Mở modal thêm bệnh nhân
    const openModalBtn = this.viewContainer.querySelector("#open-patient-modal");
    if (openModalBtn) {
      openModalBtn.addEventListener("click", () => this.openModal());
    }

    // Mở modal in danh sách bệnh nhân
    const printBtn = this.viewContainer.querySelector("#print-patient-list-btn");
    const printModal = this.viewContainer.querySelector("#print-patient-modal");
    if (printBtn && printModal) {
      printBtn.addEventListener("click", () => {
        printModal.classList.add("show");
      });
      // Đóng modal khi bấm Huỷ hoặc click ra ngoài
      const cancelBtn = printModal.querySelector("#print-patient-cancel");
      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
          printModal.classList.remove("show");
        });
      }
      printModal.addEventListener("mousedown", (e) => {
        if (e.target === printModal) printModal.classList.remove("show");
      });
      // Xác nhận in
      const confirmBtn = printModal.querySelector("#print-patient-confirm");
      if (confirmBtn) {
        confirmBtn.addEventListener("click", () => {
          const fromDateStr = printModal.querySelector("#print-from-date").value;
          const toDateStr = printModal.querySelector("#print-to-date").value;
          const fromDate = fromDateStr ? new Date(fromDateStr) : null;
          const toDate = toDateStr ? new Date(toDateStr) : null;
          // Lấy toàn bộ danh sách bệnh nhân (không phân trang, không filter UI)
          const allPatients = window.stateService ? window.stateService.getState().patients : [];
          import('../utils/excelUtils.js').then(({ exportPatientsToExcel }) => {
            exportPatientsToExcel(allPatients, fromDate, toDate);
          });
          printModal.classList.remove("show");
        });
      }
    }

    // Nút xuất viện trong bảng
    const dischargeBtns = this.viewContainer.querySelectorAll(".discharge-patient-btn");
    dischargeBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const patientId = btn.dataset.id;
        const today = new Date().toISOString().slice(0, 10);
        // Tạo dropdown xác nhận tuỳ chỉnh
        let confirmBox = document.getElementById('discharge-confirm-box');
        if (confirmBox) confirmBox.remove();
        confirmBox = document.createElement('div');
        confirmBox.id = 'discharge-confirm-box';
        confirmBox.style.position = 'fixed';
        confirmBox.style.top = '0';
        confirmBox.style.left = '0';
        confirmBox.style.width = '100vw';
        confirmBox.style.height = '100vh';
        confirmBox.style.background = 'rgba(30,41,59,0.18)';
        confirmBox.style.display = 'flex';
        confirmBox.style.alignItems = 'center';
        confirmBox.style.justifyContent = 'center';
        confirmBox.style.zIndex = '9999';
        confirmBox.innerHTML = `
          <div style="background:#fff;border-radius:18px;max-width:360px;width:92vw;padding:32px 28px 22px 28px;box-shadow:0 8px 40px #2563eb33;position:relative;animation:rise 0.18s;">
            <div style='font-size:1.18rem;font-weight:700;margin-bottom:18px;color:#133150;'>Xác nhận xuất viện</div>
            <div style='font-size:1.05rem;margin-bottom:24px;color:#334155;'>Bạn có chắc muốn xuất viện bệnh nhân này?</div>
            <div style='display:flex;gap:16px;justify-content:flex-end;'>
              <button id='discharge-cancel-btn' style='padding:8px 22px;border-radius:8px;border:none;background:#e0f2fe;color:#2563eb;font-weight:700;font-size:1.05rem;'>Huỷ</button>
              <button id='discharge-ok-btn' style='padding:8px 22px;border-radius:8px;border:none;background:#2563eb;color:#fff;font-weight:700;font-size:1.05rem;'>Xuất viện</button>
            </div>
          </div>
        `;
        document.body.appendChild(confirmBox);
        confirmBox.querySelector('#discharge-cancel-btn').onclick = () => {
          confirmBox.remove();
        };
        confirmBox.querySelector('#discharge-ok-btn').onclick = async () => {
          confirmBox.remove();
          const result = await patientService.dischargePatient(patientId, today);
          showToast(result.message);
          await patientService.syncPatientsFromCloud();
          this.renderView();
          roomController.renderView();
        };
      });
    });

    // // Nút xuất viện trong modal chỉnh sửa
    // const editModalDischargeBtn = this.viewContainer.querySelector("#patient-edit-modal .discharge-patient-btn");
    // if (editModalDischargeBtn) {
    //   editModalDischargeBtn.addEventListener("click", async () => {
    //     const patientId = editModalDischargeBtn.dataset.id; // Lấy id dạng chuỗi
    //     const today = new Date().toISOString().slice(0, 10);
    //     const confirmDischarge = confirm("Bạn có chắc muốn xuất viện bệnh nhân này?");
    //     if (confirmDischarge) {
    //       const result = await patientService.dischargePatient(patientId, today);
    //       showToast(result.message);
    //       await patientService.syncPatientsFromCloud();
    //       this.closeEditModal();
    //     }
    //   });
    // }

    // Đóng modal thêm bệnh nhân
    const cancelBtn = this.viewContainer.querySelector("#patient-modal-cancel");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.closeModal());
    }

    // Modal form submit (thêm bệnh nhân)
    const form = this.viewContainer.querySelector("#patient-modal-form");
    if (form) {
      form.addEventListener("submit", (e) => this.handleFormSubmit(e));
    }

    // Modal click outside (thêm bệnh nhân)
    const modal = this.viewContainer.querySelector("#patient-modal");
    if (modal) {
      setupModalClose(modal, () => this.closeModal());
      if (this.isModalVisible && !this.editingPatient) {
        focusFirstInputInModal(modal);
      }
    }

    // // Edit buttons
    // const editBtns = this.viewContainer.querySelectorAll(".edit-patient-btn");
    // editBtns.forEach((btn) => {
    //   btn.addEventListener("click", () => {
    //     const patientId = Number(btn.dataset.id);
    //     const patient = patientService.getPatientById(patientId);
    //     if (patient) {
    //       this.openEditModal(patient);
    //     }
    //   });
    // });

    // // Đóng modal chỉnh sửa bệnh nhân
    // const editCancelBtn = this.viewContainer.querySelector("#patient-edit-modal-cancel");
    // if (editCancelBtn) {
    //   editCancelBtn.addEventListener("click", () => this.closeEditModal());
    // }

    // // Modal form submit (chỉnh sửa bệnh nhân)
    // const editForm = this.viewContainer.querySelector("#patient-edit-modal-form");
    // if (editForm) {
    //   editForm.addEventListener("submit", (e) => this.handleEditFormSubmit(e));
    // }

    // // Modal click outside (chỉnh sửa bệnh nhân)
    // const editModal = this.viewContainer.querySelector("#patient-edit-modal");
    // if (editModal) {
    //   setupModalClose(editModal, () => this.closeEditModal());
    //   if (this.editingPatient) {
    //     focusFirstInputInModal(editModal);
    //   }
    // }

    // Lọc
    const statusFilter = this.viewContainer.querySelector("#patient-status-filter");
    const roomFilter = this.viewContainer.querySelector("#patient-room-filter");
    const applyBtn = this.viewContainer.querySelector("#apply-patient-filter");
    const resetBtn = this.viewContainer.querySelector("#reset-patient-filter");

    if (statusFilter) {
      statusFilter.value = this.filters.status;
    }
    if (roomFilter) {
      roomFilter.value = this.filters.room;
    }

    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        this.filters.status = statusFilter.value;
        this.filters.room = roomFilter.value.trim();
        this.renderView();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.filters = { status: "all", room: "" };
        this.renderView();
      });
    }

    // Modal chọn phòng/lầu
    const roomInput = this.viewContainer.querySelector("#modal-patient-room");
    const roomModal = this.viewContainer.querySelector("#room-select-modal");
    if (roomInput && roomModal) {
      roomInput.addEventListener("click", async () => {
        roomModal.style.display = "flex";
        const rooms = await roomService.getRooms();
        const patients = window.stateService ? window.stateService.getState().patients : [];
        const floorMap = {};
        const floorBedStats = {};
        rooms.forEach(room => {
          const floor = String(room.name).trim()[0];
          if (!floorMap[floor]) floorMap[floor] = [];
          floorMap[floor].push(room);
        });
        // Tính tổng số giường trống cho từng lầu
        Object.keys(floorMap).forEach(floor => {
          let emptyBeds = 0;
          floorMap[floor].forEach(room => {
            if (Array.isArray(room.beds)) {
              const usedBeds = patients.filter(p => p.room === room.name && p.status === 'admitted').map(p => p.bed);
              emptyBeds += room.beds.filter((bed, idx) => {
                let bedName;
                if (typeof bed === 'object') {
                  bedName = bed.name || bed.id || `Giường ${idx + 1}`;
                } else {
                  bedName = bed || `Giường ${idx + 1}`;
                }
                return bedName && !usedBeds.includes(bedName);
              }).length;
            }
          });
          floorBedStats[floor] = emptyBeds;
        });
        const floorList = roomModal.querySelector("#floor-list");
        const roomList = roomModal.querySelector("#room-list");
        // Reset UI
        let selectedFloor = null;
        floorList.innerHTML = Object.keys(floorMap).sort().map(f =>
          `<button type='button' class='floor-btn' data-floor='${f}' style='padding:10px 0;margin:2px 0;border-radius:8px;border:2px solid #2563eb;background:#fff;color:#2563eb;font-weight:600;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:flex-end;gap:8px;min-width:200px;max-width:260px;min-height:56px;'>
            <span style='white-space:nowrap;display:inline-block;min-width:60px;text-align:left;'>Lầu ${f}</span>
            <span style='font-size:0.93rem;color:#2563eb;background:#e0e7ef;border-radius:7px;padding:2px 16px;min-width:80px;max-width:210px;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;'>
              <span style="font-weight:700;min-width:22px;text-align:center;display:inline-block;">${floorBedStats[f]}</span>
              <span style="white-space:nowrap;">giường trống</span>
            </span>
          </button>`
        ).join("");
        roomList.innerHTML = "<div style='color:#888;font-size:1rem;padding:10px 0;'>Chọn lầu để xem phòng</div>";

        function renderRooms(floor) {
          roomList.innerHTML = floorMap[floor].map(r => `<button type='button' class='room-btn' data-room='${r.name}' style='padding:8px 16px;margin:4px 0;border-radius:7px;border:1.5px solid #2563eb;background:#f8fafd;color:#2563eb;font-size:1rem;cursor:pointer;display:flex;align-items:center;gap:10px;width:180px;box-sizing:border-box;'>
            <span>Phòng ${r.name}</span>
            <span style='font-size:0.92rem;color:#2563eb;background:#e0e7ef;border-radius:6px;padding:2px 8px;min-width:24px;display:inline-flex;align-items:center;justify-content:center;margin-left:4px;font-weight:700;'>${(() => {
              let emptyBeds = 0;
              if (Array.isArray(r.beds)) {
                const usedBeds = patients.filter(p => p.room === r.name && p.status === 'admitted').map(p => p.bed);
                emptyBeds = r.beds.filter((bed, idx) => {
                  let bedName;
                  if (typeof bed === 'object') {
                    bedName = bed.name || bed.id || `Giường ${idx + 1}`;
                  } else {
                    bedName = bed || `Giường ${idx + 1}`;
                  }
                  return bedName && !usedBeds.includes(bedName);
                }).length;
              }
              return emptyBeds;
            })()}</span>
          </button>`).join("");
          roomList.querySelectorAll('.room-btn').forEach(rbtn => {
            rbtn.onclick = function() {
              roomInput.value = rbtn.dataset.room;
              roomModal.style.display = "none";
              roomInput.dispatchEvent(new Event('change'));
            };
          });
        }

        floorList.querySelectorAll('.floor-btn').forEach(btn => {
          btn.onclick = function() {
            // Highlight lầu đang chọn
            floorList.querySelectorAll('.floor-btn').forEach(b => b.style.background = '#fff');
            btn.style.background = '#e0e7ef';
            selectedFloor = btn.dataset.floor;
            renderRooms(selectedFloor);
          };
        });

        // Ẩn modal khi bấm huỷ
        roomModal.querySelector("#room-modal-cancel").onclick = function() {
          roomModal.style.display = "none";
        };
      });
    }

    // Dropdown giường chỉ hiện khi click vào trường giường
    const bedInput = this.viewContainer.querySelector("#modal-patient-bed");
    const bedModal = document.getElementById("bed-select-modal");
    if (bedInput && roomInput && bedModal) {
      bedInput.addEventListener("click", async function () {
        const selectedRoomName = roomInput.value.trim();
        if (!selectedRoomName) {
          bedInput.value = "";
          // Hiện thông báo nổi ngay dưới input
          let msg = document.getElementById("bed-room-warning");
          if (!msg) {
            msg = document.createElement("div");
            msg.id = "bed-room-warning";
            msg.textContent = "Vui lòng chọn phòng trước";
            msg.style = "color:#e53e3e;background:#fff3f3;border:1px solid #e53e3e;padding:6px 14px;border-radius:7px;position:absolute;z-index:3000;box-shadow:0 2px 8px #0001;font-size:1rem;top:100%;left:0;margin-top:4px;";
            bedInput.parentElement.style.position = "relative";
            bedInput.parentElement.appendChild(msg);
          }
          setTimeout(() => { if (msg) msg.remove(); }, 1800);
          return;
        }
        bedModal.style.display = "flex";
        const rooms = await roomService.getRooms();
        const selectedRoom = rooms.find(r => r.name === selectedRoomName);
        const bedList = bedModal.querySelector("#bed-list");
        if (selectedRoom && Array.isArray(selectedRoom.beds)) {
          const patients = window.stateService ? window.stateService.getState().patients : [];
          const usedBeds = patients.filter(p => p.room === selectedRoom.name && p.status === 'admitted').map(p => p.bed);
          const emptyBeds = selectedRoom.beds.filter((bed, idx) => {
            let bedName;
            if (typeof bed === 'object') {
              bedName = bed.name || bed.id || `Giường ${idx + 1}`;
            } else {
              bedName = bed || `Giường ${idx + 1}`;
            }
            return bedName && !usedBeds.includes(bedName);
          });
          if (emptyBeds.length === 0) {
            bedList.innerHTML = '<div style="color:#888;font-size:1rem;padding:10px 0;">Không có giường trống</div>';
          } else {
            bedList.innerHTML = emptyBeds.map((bed, idx) => {
              let bedName;
              if (typeof bed === 'object') {
                bedName = bed.name || bed.id || `Giường ${idx + 1}`;
              } else {
                bedName = bed || `Giường ${idx + 1}`;
              }
              return `<button type='button' class='bed-btn' data-bed='${bedName}' style='padding:8px 16px;margin:4px 6px;border-radius:7px;border:1.5px solid #2563eb;background:#f8fafd;color:#2563eb;font-size:1rem;cursor:pointer;'>${bedName}</button>`;
            }).join("");
            bedList.querySelectorAll('.bed-btn').forEach(btn => {
              btn.onclick = function() {
                bedInput.value = btn.dataset.bed;
                bedModal.style.display = "none";
              };
            });
          }
        } else {
          bedList.innerHTML = '<div style="color:#888;font-size:1rem;padding:10px 0;">Không có giường trống</div>';
        }
        bedModal.querySelector("#bed-modal-cancel").onclick = function() {
          bedModal.style.display = "none";
        };
      });
    }
  }

  openModal() {
    this.isModalVisible = true;
    this.editingPatient = null;
    this.renderView();
  }

  closeModal() {
    this.isModalVisible = false;
    this.renderView();
  }

  // openEditModal(patient) {
  //   this.editingPatient = patient;
  //   this.renderView();
  // }

  // closeEditModal() {
  //   this.editingPatient = null;
  //   this.renderView();
  // }

  async handleFormSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;

    // Lấy tên y tá hiện tại từ authService
    let doctor = '';
    if (window.authService && window.authService.getCurrentUser) {
      const user = window.authService.getCurrentUser();
      if (user && user.fullName) doctor = user.fullName;
    }

    const result = await patientService.addPatient({
      name: form.name.value.trim(),
      room: form.room.value.trim(),
      bed: form.bed.value.trim(),
      status: form.status.value,
      gender: form.gender ? form.gender.value : '',
      dob: form.dob ? form.dob.value : '',
      admissionDate: form.admissionDate ? form.admissionDate.value : '',
      dischargeDate: form.dischargeDate ? form.dischargeDate.value : '',
      doctor
    });

    if (!result.success) {
      showToast(result.message);
      return;
    }

    await patientService.syncPatientsFromCloud();
    // UI will auto-update via stateService subscription
    showToast(result.message);
    // Tự động cập nhật UI phòng/giường
    roomController.renderView();
    this.closeModal();
  }

  // async handleEditFormSubmit(event) {
  //   event.preventDefault();
  //   const form = event.currentTarget;
  //   const patientId = Number(form.querySelector("#edit-patient-id").value);

  //   const result = await patientService.updatePatient(patientId, {
  //     name: form.name.value.trim(),
  //     room: form.room.value.trim(),
  //     bed: form.bed.value.trim(),
  //     status: form.status.value,
  //     gender: form.gender ? form.gender.value : '',
  //     dob: form.dob ? form.dob.value : '',
  //     admissionDate: form.admissionDate ? form.admissionDate.value : '',
  //     dischargeDate: form.dischargeDate ? form.dischargeDate.value : '',
  //   });

  //   if (!result.success) {
  //     showToast(result.message);
  //     return;
  //   }

  //   await patientService.syncPatientsFromCloud();
  //   // UI will auto-update via stateService subscription
  //   showToast(result.message);
  //   this.closeEditModal();
  // }
}

export default new PatientController();
