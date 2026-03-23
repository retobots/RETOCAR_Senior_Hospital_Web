// ============================================
// SMART HOSPITAL - ENTRY POINT
// ============================================
// Kiến trúc:
// - Data Layer: constants + models
// - Services: singleton classes xử lý logic
// - Views: pure functions render HTML
// - Controllers: handle events + orchestrate
// - Utils: formatters, UI helpers
// ============================================

import appController from "./controllers/appController.js";

// Khởi tạo ứng dụng
appController.init();
