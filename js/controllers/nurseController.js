// ============================================
// NURSE CONTROLLER - Xử lý events y tá
// ============================================

import nurseService from "../services/nurseService.js";
import authService from "../services/authService.js";
import { renderNurseView } from "../views/nurseView.js";
import { showToast, setupModalClose, focusFirstInputInModal } from "../utils/ui.js";

class NurseController {
  constructor() {
    this.viewContainer = document.getElementById("view-nurses");
    this.isModalVisible = false;
    this.filters = { role: "all", status: "all" };
  }

  init() {
    // Render sẽ được gọi khi switch view
  }

  renderView(searchQuery = "") {
    // Lọc y tá
    const filteredNurses = nurseService.filterNurses({
      role: this.filters.role,
      status: this.filters.status,
      search: searchQuery,
    });

    // Render view
    renderNurseView(this.viewContainer, filteredNurses, this.isModalVisible);

    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mở modal
    const openModalBtn = this.viewContainer.querySelector("#open-nurse-modal");
    if (openModalBtn) {
      openModalBtn.addEventListener("click", () => this.openModal());
    }

    // Đóng modal
    const cancelBtn = this.viewContainer.querySelector("#nurse-modal-cancel");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.closeModal());
    }

    // Modal form submit
    const form = this.viewContainer.querySelector("#nurse-modal-form");
    if (form) {
      form.addEventListener("submit", (e) => this.handleFormSubmit(e));
    }

    // Modal click outside
    const modal = this.viewContainer.querySelector("#nurse-modal");
    if (modal) {
      setupModalClose(modal, () => this.closeModal());
      if (this.isModalVisible) {
        focusFirstInputInModal(modal);
      }
    }

    // Lọc
    const roleFilter = this.viewContainer.querySelector("#nurse-role-filter");
    const statusFilter = this.viewContainer.querySelector("#nurse-status-filter");
    const applyBtn = this.viewContainer.querySelector("#apply-nurse-filter");
    const resetBtn = this.viewContainer.querySelector("#reset-nurse-filter");

    if (roleFilter) {
      roleFilter.value = this.filters.role;
    }
    if (statusFilter) {
      statusFilter.value = this.filters.status;
    }

    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        this.filters.role = roleFilter.value;
        this.filters.status = statusFilter.value;
        this.renderView();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.filters = { role: "all", status: "all" };
        this.renderView();
      });
    }

    // Edit, change password, delete buttons
    this.viewContainer.querySelectorAll(".edit-nurse-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = Number(btn.dataset.id);
        this.handleEditNurse(id);
      });
    });

    this.viewContainer.querySelectorAll(".change-password-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        this.handleChangePassword(id);
      });
    });

    this.viewContainer.querySelectorAll(".delete-nurse-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        this.handleDeleteNurse(id);
      });
    });
  }

  openModal() {
    this.isModalVisible = true;
    this.renderView();
  }

  closeModal() {
    this.isModalVisible = false;
    this.renderView();
  }

  handleFormSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;

    const result = nurseService.addNurse({
      fullName: form.fullName.value.trim(),
      username: form.username.value.trim(),
      password: form.password.value.trim(),
    });

    if (!result.success) {
      showToast(result.message);
      return;
    }

    showToast(result.message);
    this.closeModal();
  }

  handleEditNurse(id) {
    if (!authService.can("nurses.edit")) {
      showToast("Bạn không có quyền sửa tài khoản y tá.");
      return;
    }

    const nurse = nurseService.getNurseById(id);
    if (!nurse) return;

    const fullName = prompt("Đổi tên y tá:", nurse.fullName);
    if (!fullName) return;

    const status = prompt("Trạng thái (active/inactive):", nurse.status);
    if (!status || !["active", "inactive"].includes(status.toLowerCase())) {
      showToast("Trạng thái không hợp lệ.");
      return;
    }

    const result = nurseService.editNurse(id, { fullName, status: status.toLowerCase() });
    if (result.success) {
      showToast(result.message);
      this.renderView();
    } else {
      showToast(result.message);
    }
  }

  handleChangePassword(id) {
    const nurse = nurseService.getNurseById(id);
    if (!nurse) return;

    const newPassword = prompt(`Nhập mật khẩu mới cho ${nurse.username}:`);
    if (!newPassword) return;

    const result = nurseService.changePassword(id, newPassword);
    if (result.success) {
      showToast(result.message);
      this.renderView();
    } else {
      showToast(result.message);
    }
  }

  handleDeleteNurse(id) {
    const nurse = nurseService.getNurseById(id);
    if (!nurse) return;

    if (!confirm(`Xóa tài khoản ${nurse.username}?`)) return;

    const result = nurseService.deleteNurse(id);
    if (!result.success) {
      showToast(result.message);
      return;
    }

    showToast(result.message);

    if (result.deletedCurrentUser) {
      setTimeout(() => {
        // Đăng xuất
        document.getElementById("logout-btn").click();
      }, 500);
    } else {
      this.renderView();
    }
  }
}

export default new NurseController();
