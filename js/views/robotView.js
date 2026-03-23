// ============================================
// ROBOT VIEW - Render UI robot
// ============================================

export function renderRobotView(container, robots, stats, selectedRobotId = null) {
  const selectedRobot = robots.find((r) => String(r.id) === String(selectedRobotId)) || robots[0] || null;

  const robotItems = robots
    .map((r) => {
      const isActive = selectedRobot && String(selectedRobot.id) === String(r.id);

      return `
      <button class="robot-avatar-card ${isActive ? "active" : ""}" data-robot-id="${r.id}" type="button">
        <div class="robot-avatar-wrap ${r.online ? "" : "offline"}">
          <img src="image/robot.png" alt="${r.name}" class="robot-avatar-image" />
        </div>
        <h4>${r.name}</h4>
        <p><span class="badge ${r.online ? "online" : "offline"}">${r.online ? "Online" : "Offline"}</span></p>
      </button>
    `;
    })
    .join("");

  const detailCard = selectedRobot
    ? `
      <div class="card robot-detail-card">
        <div class="robot-detail-head">
          <div>
            <h3>${selectedRobot.name}</h3>
            <p>Thông tin chi tiết robot đang chọn</p>
          </div>
          <span class="badge ${selectedRobot.online ? "online" : "offline"}">${selectedRobot.online ? "Online" : "Offline"}</span>
        </div>

        <div class="robot-detail-grid">
          <div class="robot-metric">
            <span>Pin hiện tại</span>
            <strong>${selectedRobot.battery}%</strong>
            <progress max="100" value="${selectedRobot.battery}"></progress>
          </div>
          <div class="robot-metric">
            <span>Tầng phục vụ</span>
            <strong>${selectedRobot.floor}</strong>
          </div>
          <div class="robot-metric robot-task">
            <span>Tác vụ hiện tại</span>
            <strong>${selectedRobot.task}</strong>
          </div>
        </div>
      </div>
    `
    : "";

  container.innerHTML = `
    <div class="section-head">
      <div>
        <h2>Đội robot</h2>
        <p>Theo dõi robot giao thuốc theo thời gian thực</p>
      </div>
    </div>

    <div class="grid-3">
      <div class="stat"><span>Tổng số robot</span><strong>${stats.total}</strong></div>
      <div class="stat"><span>Đang online</span><strong style="color:#0d9d52">${stats.online}</strong></div>
      <div class="stat"><span>Đang giao thuốc</span><strong style="color:#2563eb">1</strong></div>
    </div>

    <div class="card robot-picker-card">
      <div class="robot-picker-head">
        <h3>Danh sách robot</h3>
        <p>Nhấn vào robot để xem pin, tầng phục vụ và tác vụ</p>
      </div>
      <div class="robot-avatar-grid">${robotItems}</div>
    </div>

    ${detailCard}
  `;
}
