// ============================================
// DELIVERY SERVICE - Quản lý ngăn thuốc
// ============================================

import stateService from "./stateService.js";
import authService from "./authService.js";
import logService from "./logService.js";
import { DEFAULT_STATE } from "../data/constants.js";

class DeliveryService {
  // Lấy danh sách ngăn thuốc
  getDeliveryBins() {
    const state = stateService.getState();
    stateService.ensureDeliveryBinsValid();
    return state.deliveryBins;
  }

  // Cập nhật ngăn thuốc
  updateBin(index, field, value) {
    if (!authService.can("delivery.edit")) {
      return { success: false, message: "Không có quyền chỉnh sửa ngăn thuốc." };
    }

    const state = stateService.getState();
    if (index < 0 || index >= state.deliveryBins.length) {
      return { success: false, message: "Ngăn không hợp lệ." };
    }

    state.deliveryBins[index][field] = value;
    stateService.saveState();
    return { success: true };
  }

  // Xóa dữ liệu ngăn
  clearBin(index) {
    if (!authService.can("delivery.edit")) {
      logService.addSystemLog("delivery", "Xóa dữ liệu ngăn thuốc", "denied", `Ngăn ${index + 1}`);
      return { success: false, message: "Không có quyền chỉnh sửa ngăn thuốc." };
    }

    const state = stateService.getState();
    if (index < 0 || index >= state.deliveryBins.length) {
      return { success: false, message: "Ngăn không hợp lệ." };
    }

    state.deliveryBins[index] = { patientId: "", note: "" };
    stateService.saveState();
    logService.addSystemLog("delivery", "Xóa dữ liệu ngăn thuốc", "success", `Ngăn ${index + 1}`);
    return { success: true, message: "Đã xóa dữ liệu ngăn." };
  }

  // Lấy número ngăn sẵn sàng
  getReadyBinsCount() {
    const state = stateService.getState();
    return state.deliveryBins.filter((bin) => bin.patientId && bin.note.trim()).length;
  }

  // Bắt đầu nhiệm vụ giao thuốc
  startMission() {
    if (!authService.can("delivery.start")) {
      logService.addSystemLog("delivery", "Gửi lệnh giao thuốc", "denied", "Không đủ quyền");
      return { success: false, message: "Không có quyền gửi lệnh giao thuốc." };
    }

    const state = stateService.getState();
    const readyBins = state.deliveryBins.filter((bin) => bin.patientId && bin.note.trim());

    if (!readyBins.length) {
      return { success: false, message: "Cần chọn bệnh nhân và nhập ghi chú trước khi gửi lệnh." };
    }

    // Tìm robot online
    const onlineRobot = state.robots.find((robot) => robot.online);
    const robotName = onlineRobot ? onlineRobot.name : "MedBot";
    const today = new Date().toISOString().slice(0, 10);
    const nextLogId = state.deliveryLogs.length ? Math.max(...state.deliveryLogs.map((log) => log.id)) + 1 : 1;

    // Thêm log cho mỗi ngăn sẵn sàng
    readyBins.forEach((bin, i) => {
      const patient = state.patients.find((p) => String(p.id) === String(bin.patientId));
      state.deliveryLogs.push({
        id: nextLogId + i,
        patient: patient ? patient.name : "Unknown",
        nurse: authService.getCurrentUser() ? authService.getCurrentUser().fullName : "Unknown",
        robot: robotName,
        status: "success",
        date: today,
      });
    });

    // Reset delivery bins
    state.deliveryBins = structuredClone(DEFAULT_STATE.deliveryBins);

    stateService.saveState();
    logService.addSystemLog("delivery", "Gửi lệnh giao thuốc", "success", `${readyBins.length} ngăn`);
    return { success: true, message: "Đã gửi lệnh giao thuốc thành công.", binsCount: readyBins.length };
  }
}

export default new DeliveryService();
