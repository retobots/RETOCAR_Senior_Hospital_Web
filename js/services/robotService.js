// ============================================
// ROBOT SERVICE - Quản lý robot
// ============================================

import stateService from "./stateService.js";

class RobotService {
  // Lấy danh sách robot
  getRobots() {
    return stateService.getState().robots || [];
  }

  // Lấy robot theo ID
  getRobotById(id) {
    return this.getRobots().find((r) => r.id === id);
  }

  // Lấy số robot online
  getOnlineRobotsCount() {
    return this.getRobots().filter((r) => r.online).length;
  }

  // Lấy robot online đầu tiên
  getFirstOnlineRobot() {
    return this.getRobots().find((robot) => robot.online);
  }

  // Lấy thống kê robot
  getRobotStats() {
    const robots = this.getRobots();
    return {
      total: robots.length,
      online: this.getOnlineRobotsCount(),
      offline: robots.length - this.getOnlineRobotsCount(),
    };
  }
}

export default new RobotService();
