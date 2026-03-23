// ============================================
// APP CONTROLLER - Điều phối ứng dụng chính
// ============================================

import stateService from "../services/stateService.js";
import authService from "../services/authService.js";
import logService from "../services/logService.js";
import { renderLoginView, setLoginError, resetLoginForm } from "../views/loginView.js";
import { renderMenuView, updateActiveMenuItem } from "../views/menuView.js";
import patientController from "./patientController.js";
import nurseController from "./nurseController.js";
import robotController from "./robotController.js";
import deliveryController from "./deliveryController.js";
import logsController from "./logsController.js";
import { showToast } from "../utils/ui.js";

class AppController {
  constructor() {
    this.loginScreen = document.getElementById("login-screen");
    this.dashboard = document.getElementById("dashboard");
    this.menuEl = document.getElementById("menu");
    this.profileName = document.getElementById("profile-name");
    this.profileRole = document.getElementById("profile-role");
    this.avatar = document.getElementById("avatar");
    this.permissionBadge = document.getElementById("permission-badge");
    this.logoutBtn = document.getElementById("logout-btn");
    this.globalSearch = document.getElementById("global-search");

    this.viewMap = {
      patients: document.getElementById("view-patients"),
      nurses: document.getElementById("view-nurses"),
      robots: document.getElementById("view-robots"),
      delivery: document.getElementById("view-delivery"),
      logs: document.getElementById("view-logs"),
    };

    this.activeView = "patients";

    // Đảm bảo delivery bins hợp lệ
    stateService.ensureDeliveryBinsValid();
    stateService.ensureSystemLogsValid();
  }

  init() {
    // Setup login form (không render, dùng HTML có sẵn)
    const loginForm = this.loginScreen.querySelector("#login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    }

    // Setup logout
    this.logoutBtn.addEventListener("click", () => this.handleLogout());

    // Setup global search
    this.globalSearch.addEventListener("input", () => this.renderActiveView());

    // Setup menu item click
    document.addEventListener("menuItemClick", (e) => {
      this.switchView(e.detail.key);
    });

    // Khởi tạo các controller con
    patientController.init();
    nurseController.init();
    robotController.init();
    deliveryController.init();
    logsController.init();
  }

  handleLogin(event) {
    event.preventDefault();
    const username = this.loginScreen.querySelector("#username").value.trim();
    const password = this.loginScreen.querySelector("#password").value.trim();

    const result = authService.login(username, password);
    if (!result.success) {
      logService.addSystemLog("auth", "Đăng nhập", "failed", `Sai thông tin: ${username || "(trống)"}`);
      const errorEl = this.loginScreen.querySelector("#login-error");
      if (errorEl) {
        errorEl.textContent = result.message;
      }
      return;
    }

    // Đăng nhập thành công
    this.loginScreen.classList.add("hidden");
    this.dashboard.classList.remove("hidden");
    resetLoginForm(this.loginScreen);
    logService.addSystemLog("auth", "Đăng nhập", "success", `Đăng nhập: ${result.user.username}`);
    this.hydrateUserUi();
    this.renderMenu();
    this.switchView("patients");
  }

  handleLogout() {
    const user = authService.getCurrentUser();
    if (user) {
      logService.addSystemLog("auth", "Đăng xuất", "success", `Đăng xuất: ${user.username}`);
    }
    authService.logout();
    this.dashboard.classList.add("hidden");
    this.loginScreen.classList.remove("hidden");
    resetLoginForm(this.loginScreen);
  }

  hydrateUserUi() {
    const user = authService.getCurrentUser();
    this.profileName.textContent = user.fullName;
    this.profileRole.textContent = user.role === "head_nurse" ? "Y tá trưởng" : "Y tá";
    this.avatar.textContent = user.fullName.slice(0, 1).toUpperCase();
    this.permissionBadge.textContent =
      user.role === "head_nurse" ? "Quyền: Quản lý bệnh nhân, y tá, nhật ký" : "Quyền: Vận hành giao thuốc";
  }

  renderMenu() {
    renderMenuView(this.menuEl, this.activeView);
  }

  switchView(viewKey) {
    this.activeView = viewKey;

    // Ẩn/hiện view
    Object.entries(this.viewMap).forEach(([key, element]) => {
      element.classList.toggle("hidden", key !== viewKey);
    });

    // Cập nhật menu
    updateActiveMenuItem(this.menuEl, viewKey);

    this.renderActiveView();
  }

  renderActiveView() {
    const searchQuery = this.globalSearch.value.trim().toLowerCase();

    if (this.activeView === "patients") {
      patientController.renderView(searchQuery);
    } else if (this.activeView === "nurses") {
      nurseController.renderView(searchQuery);
    } else if (this.activeView === "robots") {
      robotController.renderView();
    } else if (this.activeView === "delivery") {
      deliveryController.renderView();
    } else if (this.activeView === "logs") {
      logsController.renderView(searchQuery);
    }
  }

  // Hiển thị toast từ các controller khác
  showMessage(message) {
    showToast(message);
  }
}

export default new AppController();
