// ============================================
// ROBOT CONTROLLER - Xử lý events robot
// ============================================

import robotService from "../services/robotService.js";
import { renderRobotView } from "../views/robotView.js";

class RobotController {
  constructor() {
    this.viewContainer = document.getElementById("view-robots");
    this.selectedRobotId = null;
  }

  init() {
    // Render sẽ được gọi khi switch view
  }

  renderView() {
    const robots = robotService.getRobots();
    const stats = robotService.getRobotStats();
    if (!this.selectedRobotId && robots.length) {
      this.selectedRobotId = robots[0].id;
    }

    renderRobotView(this.viewContainer, robots, stats, this.selectedRobotId);
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.viewContainer.querySelectorAll(".robot-avatar-card").forEach((button) => {
      button.addEventListener("click", () => {
        this.selectedRobotId = Number(button.dataset.robotId);
        this.renderView();
      });
    });
  }
}

export default new RobotController();
