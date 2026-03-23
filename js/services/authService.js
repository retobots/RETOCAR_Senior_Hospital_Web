// ============================================
// AUTH SERVICE - Quản lý xác thực và quyền hạn
// ============================================

import stateService from "./stateService.js";
import { ROLE_PERMISSIONS } from "../data/constants.js";

class AuthService {
  constructor() {
    this.currentUser = null;
  }

  // Đăng nhập
  login(username, password) {
    const state = stateService.getState();
    const user = state.users.find(
      (entry) => entry.username.toLowerCase() === username.toLowerCase() && entry.password === password
    );

    if (!user) {
      return { success: false, message: "Sai tài khoản hoặc mật khẩu." };
    }

    this.currentUser = user;
    return { success: true, user };
  }

  // Đăng xuất
  logout() {
    this.currentUser = null;
  }

  // Lấy user hiện tại
  getCurrentUser() {
    return this.currentUser;
  }

  // Kiểm tra người dùng đã đăng nhập chưa
  isLoggedIn() {
    return this.currentUser !== null;
  }

  // Kiểm tra quyền hạn
  can(permission) {
    if (!this.currentUser) return false;
    const granted = ROLE_PERMISSIONS[this.currentUser.role] || [];
    return granted.includes(permission);
  }

  // Kiểm tra có phải y tá trưởng không
  isHeadNurse() {
    return this.currentUser && this.currentUser.role === "head_nurse";
  }

  // Lấy danh sách quyền của user
  getPermissions() {
    if (!this.currentUser) return [];
    return ROLE_PERMISSIONS[this.currentUser.role] || [];
  }
}

export default new AuthService();
