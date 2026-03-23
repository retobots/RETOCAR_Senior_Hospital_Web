// ============================================
// CLEAN ARCHITECTURE - HƯỚNG DẪN NHANH
// ============================================

## 📋 Tóm Tắt Cấu Trúc

```
js/
├── data/           → Hằng số, default data (không logic)
├── services/       → Business logic (dữ liệu + quy tắc)
├── views/          → Render HTML (chỉ hiển thị)
├── controllers/    → Handle events + điều phối
├── utils/          → Formatter, helpers
└── index.js        → Entry point
```

---

## 🔄 Quy Trình Xử Lý

### Ví dụ: Thêm Bệnh Nhân

```
1. User click "Thêm bệnh nhân"
   ↓
2. patientController.openModal()
   ↓
3. renderPatientView() → Hiển thị modal
   ↓
4. User nhập form + click Save
   ↓
5. controller.handleFormSubmit()
   ↓
6. patientService.addPatient(data)
   ├─ Validate dữ liệu
   ├─ Thêm vào state
   ├─ Save localStorage
   └─ Return { success: true }
   ↓
7. controller.renderView()
   ├─ Gọi patientService.filterPatients()
   ├─ Gọi renderPatientView()
   └─ setupEventListeners()
   ↓
8. DOM cập nhật + Modal đóng
```

---

## 📁 File Nào Để Làm Gì?

### Muốn thêm logic?
→ Thêm function vào **services** (patientService, nurseService, v.v.)

```javascript
// js/services/patientService.js
export default new PatientService();

class PatientService {
  addPatient(data) {
    // Logic xử lý ở đây
  }
}
```

### Muốn thêm button/form?
→ Thêm HTML vào **views** + xử lý event ở **controllers**

```javascript
// js/views/patientView.js
export function renderPatientView(container, patients) {
  container.innerHTML = `<button id="add-btn">Thêm</button>...`;
  // Không setup events ở đây!
}

// js/controllers/patientController.js
class PatientController {
  setupEventListeners() {
    const btn = this.viewContainer.querySelector("#add-btn");
    btn.addEventListener("click", () => {
      // Handle event
    });
  }
}
```

### Muốn format dữ liệu?
→ Thêm function vào **utils/formatter.js**

```javascript
// js/utils/formatter.js
export function formatPatientStatus(status) {
  return status === "admitted" ? "Nhập viện" : "Xuất viện";
}
```

---

## ✅ Lợi Ích Của Clean Architecture

| Yêu Cầu | Old Code | New Code |
|---------|----------|----------|
| Thêm tính năng | Khó - phải modify app.js 1500 dòng | Dễ - tạo file mới, hook vào controller |
| Fix bug | Khó - tìm code trộn lẫn | Dễ - logic ở service, event ở controller |
| Test code | Không thể test (phụ thuộc DOM) | Có thể test services (pure logic) |
| Tái sử dụng | Không thể | Có thể dùng services ở nhiều chỗ |
| Đọc hiểu | Khó - 1 file quá dài | Dễ - biết mỗi file làm gì |

---

## 🚀 VÍ DỤ: Thêm Feature "Room Management"

### Bước 1: Tạo Room Service
```javascript
// js/services/roomService.js
class RoomService {
  getRooms() { ... }
  addRoom(roomData) { ... }
  deleteRoom(id) { ... }
}
```

### Bước 2: Tạo Room View
```javascript
// js/views/roomView.js
export function renderRoomView(container, rooms) {
  container.innerHTML = `...`;
}
```

### Bước 3: Tạo Room Controller
```javascript
// js/controllers/roomController.js
class RoomController {
  renderView() { ... }
  setupEventListeners() { ... }
}
```

### Bước 4: Hook vào App Controller
```javascript
// js/controllers/appController.js
import roomController from "./roomController.js";

class AppController {
  init() {
    roomController.init();  // ← Thêm dòng này
  }
  
  renderActiveView() {
    if (this.activeView === "rooms") {
      roomController.renderView();
    }
  }
}
```

### Bước 5: Thêm menu item
```javascript
// js/data/constants.js
export const MENU_ITEMS = [
  ...existing items,
  { key: "rooms", label: "<i class='icon'>🚪</i> Phòng" }
];
```

---

## 🎯 Nguyên Tắc Thiết Kế

1. **Separation of Concerns** - Mỗi file một trách nhiệm
2. **Single Responsibility** - Mỗi function làm một việc
3. **DRY** (Don't Repeat Yourself) - Tái sử dụng code
4. **Dependencies Down** - Views không biết về Controllers

---

## 💡 Tips

- Chạy app bằng mở `index.html` trong browser
- DevTools Console sẽ show errors nếu có
- State được save vào localStorage tự động
- Dùng `stateService.getState()` để debug

---

## 🔗 Tài Liệu Thêm

Xem file `ARCHITECTURE.md` để hiểu rõ hơn về:
- Data flow
- Service patterns
- View rendering
- Event handling

