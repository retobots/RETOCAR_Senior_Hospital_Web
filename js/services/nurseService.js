// ============================================
// NURSE SERVICE - CRUD y tá
// ============================================

import stateService from "./stateService.js";
import authService from "./authService.js";
import logService from "./logService.js";

class NurseService {
  // Lấy danh sách y tá
  getNurses() {
    return stateService.getState().users || [];
  }

  // Lọc y tá theo điều kiện
  filterNurses(filters = {}) {
    let nurses = this.getNurses();

    // Lọc theo vai trò
    if (filters.role && filters.role !== "all") {
      nurses = nurses.filter((u) => u.role === filters.role);
    }

    // Lọc theo trạng thái
    if (filters.status && filters.status !== "all") {
      nurses = nurses.filter((u) => u.status === filters.status);
    }

    // Tìm kiếm toàn bộ text
    if (filters.search && filters.search.trim()) {
      const query = filters.search.toLowerCase();
      nurses = nurses.filter((u) => {
        const text = [u.fullName, u.username, u.role, u.status].join(" ").toLowerCase();
        return text.includes(query);
      });
    }

    return nurses;
  }

  // Lấy y tá theo ID
  getNurseById(id) {
    return this.getNurses().find((u) => u.id === id);
  }

  // Thêm y tá mới
  addNurse(nurseData) {
    if (!authService.can("nurses.create")) {
      logService.addSystemLog("nurses", "Thêm tài khoản y tá", "denied", "Không đủ quyền");
      return { success: false, message: "Không có quyền thêm tài khoản y tá." };
    }

    const { fullName, username, password } = nurseData;

    if (!fullName || !username || !password) {
      return { success: false, message: "Vui lòng nhập đủ tên, tài khoản, mật khẩu." };
    }

    const state = stateService.getState();
    if (state.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, message: "Username đã tồn tại." };
    }

    const nextId = state.users.length ? Math.max(...state.users.map((u) => u.id)) + 1 : 1;
    state.users.push({
      id: nextId,
      fullName,
      username,
      password,
      role: "nurse",
      status: "active",
    });

    stateService.saveState();
    logService.addSystemLog("nurses", "Thêm tài khoản y tá", "success", `Username: ${username}`);
    return { success: true, message: "Đã thêm tài khoản y tá." };
  }

  // Sửa thông tin y tá
  editNurse(id, nurseData) {
    if (!authService.can("nurses.edit")) {
      logService.addSystemLog("nurses", "Sửa tài khoản y tá", "denied", `ID: ${id}`);
      return { success: false, message: "Không có quyền sửa tài khoản y tá." };
    }

    const nurse = this.getNurseById(id);
    if (!nurse) {
      return { success: false, message: "Không tìm thấy y tá." };
    }

    const { fullName, status } = nurseData;
    if (fullName) nurse.fullName = fullName;
    if (status && ["active", "inactive"].includes(status)) nurse.status = status;

    stateService.saveState();
    logService.addSystemLog("nurses", "Sửa tài khoản y tá", "success", `ID: ${id}`);
    return { success: true, message: "Đã cập nhật thông tin y tá." };
  }

  // Đổi mật khẩu
  changePassword(id, newPassword) {
    if (!authService.can("nurses.password")) {
      logService.addSystemLog("nurses", "Đổi mật khẩu y tá", "denied", `ID: ${id}`);
      return { success: false, message: "Không có quyền đổi mật khẩu y tá." };
    }

    const nurse = this.getNurseById(id);
    if (!nurse) {
      return { success: false, message: "Không tìm thấy y tá." };
    }

    if (!newPassword || newPassword.trim().length === 0) {
      return { success: false, message: "Mật khẩu không được rỗng." };
    }

    nurse.password = newPassword;
    stateService.saveState();
    logService.addSystemLog("nurses", "Đổi mật khẩu y tá", "success", `ID: ${id}`);
    return { success: true, message: "Đã đổi mật khẩu." };
  }

  // Xóa y tá
  deleteNurse(id) {
    if (!authService.can("nurses.delete")) {
      logService.addSystemLog("nurses", "Xóa tài khoản y tá", "denied", `ID: ${id}`);
      return { success: false, message: "Không có quyền xóa tài khoản y tá." };
    }

    const nurse = this.getNurseById(id);
    if (!nurse) {
      return { success: false, message: "Không tìm thấy y tá." };
    }

    const state = stateService.getState();
    const headNurseCount = state.users.filter((u) => u.role === "head_nurse").length;

    if (nurse.role === "head_nurse" && headNurseCount <= 2) {
      return { success: false, message: "Phải giữ tối thiểu 2 tài khoản y tá trưởng." };
    }

    state.users = state.users.filter((u) => u.id !== id);
    stateService.saveState();
    logService.addSystemLog("nurses", "Xóa tài khoản y tá", "success", `ID: ${id}`);
    return { success: true, message: "Đã xóa tài khoản.", deletedCurrentUser: authService.getCurrentUser()?.id === id };
  }
}

export default new NurseService();
