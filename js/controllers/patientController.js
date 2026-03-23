// ============================================
// PATIENT CONTROLLER - Xử lý events bệnh nhân
// ============================================

import patientService from "../services/patientService.js";
import stateService from "../services/stateService.js";
import { renderPatientView } from "../views/patientView.js";
import { showToast, setupModalClose, focusFirstInputInModal } from "../utils/ui.js";

class PatientController {
  constructor() {
    this.viewContainer = document.getElementById("view-patients");
    this.isModalVisible = false;
    this.editingPatient = null;
    this.filters = { status: "all", room: "" };
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
  }

  setupEventListeners() {
    // Mở modal thêm bệnh nhân
    const openModalBtn = this.viewContainer.querySelector("#open-patient-modal");
    if (openModalBtn) {
      openModalBtn.addEventListener("click", () => this.openModal());
    }

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

    // Edit buttons
    const editBtns = this.viewContainer.querySelectorAll(".edit-patient-btn");
    editBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const patientId = Number(btn.dataset.id);
        const patient = patientService.getPatientById(patientId);
        if (patient) {
          this.openEditModal(patient);
        }
      });
    });

    // Đóng modal chỉnh sửa bệnh nhân
    const editCancelBtn = this.viewContainer.querySelector("#patient-edit-modal-cancel");
    if (editCancelBtn) {
      editCancelBtn.addEventListener("click", () => this.closeEditModal());
    }

    // Modal form submit (chỉnh sửa bệnh nhân)
    const editForm = this.viewContainer.querySelector("#patient-edit-modal-form");
    if (editForm) {
      editForm.addEventListener("submit", (e) => this.handleEditFormSubmit(e));
    }

    // Modal click outside (chỉnh sửa bệnh nhân)
    const editModal = this.viewContainer.querySelector("#patient-edit-modal");
    if (editModal) {
      setupModalClose(editModal, () => this.closeEditModal());
      if (this.editingPatient) {
        focusFirstInputInModal(editModal);
      }
    }

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

  openEditModal(patient) {
    this.editingPatient = patient;
    this.renderView();
  }

  closeEditModal() {
    this.editingPatient = null;
    this.renderView();
  }

  handleFormSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;

    const result = patientService.addPatient({
      name: form.name.value.trim(),
      room: form.room.value.trim(),
      bed: form.bed.value.trim(),
      status: form.status.value,
    });

    if (!result.success) {
      showToast(result.message);
      return;
    }

    showToast(result.message);
    this.closeModal();
  }

  handleEditFormSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const patientId = Number(form.querySelector("#edit-patient-id").value);

    const result = patientService.updatePatient(patientId, {
      name: form.name.value.trim(),
      room: form.room.value.trim(),
      bed: form.bed.value.trim(),
      status: form.status.value,
    });

    if (!result.success) {
      showToast(result.message);
      return;
    }

    showToast(result.message);
    this.closeEditModal();
  }
}

export default new PatientController();
