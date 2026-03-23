// ============================================
// CLEAN ARCHITECTURE - CẤU TRÚC DỰ ÁN
// ============================================

# 📁 Cấu Trúc Thư Mục

```
project/
├── js/
│   ├── data/                 # 📊 Dữ liệu (constants, models)
│   │   └── constants.js      # Hằng số, default state
│   │
│   ├── services/             # 🔧 Services (business logic)
│   │   ├── stateService.js   # Quản lý state global
│   │   ├── authService.js    # Authentication & authorization
│   │   ├── patientService.js # CRUD bệnh nhân
│   │   ├── nurseService.js   # CRUD y tá
│   │   ├── deliveryService.js # Quản lý ngăn thuốc
│   │   ├── robotService.js   # Thông tin robot
│   │   └── logService.js     # Quản lý logs
│   │
│   ├── views/                # 🎨 Views (UI rendering only)
│   │   ├── loginView.js      # Login screen
│   │   ├── menuView.js       # Menu navigation
│   │   ├── patientView.js    # Patient list UI
│   │   ├── nurseView.js      # Nurse list UI
│   │   ├── robotView.js      # Robot list UI
│   │   ├── deliveryView.js   # Delivery UI
│   │   └── logsView.js       # Logs UI
│   │
│   ├── controllers/          # 🎮 Controllers (event handlers)
│   │   ├── appController.js  # Main app orchestration
│   │   ├── patientController.js
│   │   ├── nurseController.js
│   │   ├── robotController.js
│   │   ├── deliveryController.js
│   │   └── logsController.js
│   │
│   ├── utils/                # 🛠️ Utilities
│   │   ├── formatter.js      # Format functions (date, status, etc.)
│   │   └── ui.js             # Toast, modal helpers
│   │
│   └── index.js              # 📍 Entry point
│
├── index.html                # HTML template
├── styles.css                # Styles
├── image/                    # Images
└── README.md                 # This file
```

---

# 🏗️ Kiến Trúc & Nguyên Tắc

## 1. **Data Layer** (js/data/)
- **Chức năng**: Định nghĩa constants, models
- **Đặc điểm**: Chỉ chứa dữ liệu, không có logic
- **File**: `constants.js`

```javascript
// Không logic ở đây - chỉ dữ liệu
export const ROLE_PERMISSIONS = { ... }
export const DEFAULT_STATE = { ... }
```

---

## 2. **Services** (js/services/)
- **Chức năng**: Xử lý business logic
- **Đặc điểm**: 
  - Singleton pattern
  - Không phụ thuộc vào UI
  - Tái sử dụng được
  
### Ví dụ:
```javascript
// patientService.js - Pure logic
export default new PatientService();

class PatientService {
  addPatient(data) {
    // Logic xử lý - không liên quan đến DOM
  }
  
  filterPatients(filters) {
    // Pure function logic
  }
}
```

---

## 3. **Views** (js/views/)
- **Chức năng**: Render HTML
- **Đặc điểm**:
  - Hàm pure (không có side-effects)
  - Chỉ nhận dữ liệu, trả về HTML
  - Không xử lý events
  - Không gọi services trực tiếp

```javascript
// patientView.js - Render only
export function renderPatientView(container, patients, isModalVisible) {
  container.innerHTML = `...HTML...`;
  // Không setup events ở đây!
}
```

---

## 4. **Controllers** (js/controllers/)
- **Chức năng**: Điều phối & xử lý events
- **Trách nhiệm**:
  - Gọi services để lấy/sửa dữ liệu
  - Gọi views để render
  - Setup event listeners
  - Manage local state (filters, visibility, etc.)

```javascript
// patientController.js - Orchestration
class PatientController {
  renderView() {
    // 1. Gdata từ service
    const patients = patientService.getPatients();
    
    // 2. Render view
    renderPatientView(this.container, patients);
    
    // 3. Setup events
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Handle button clicks, form submits, etc.
  }
}
```

---

## 5. **Utils** (js/utils/)
- **Chức năng**: Helper functions
- **Ví dụ**:
  - `formatter.js`: Format data (status, date, etc.)
  - `ui.js`: Toast, modal helpers

```javascript
// formatter.js - Pure functions
export function formatPatientStatus(status) {
  if (status === "admitted") return "Nhập viện";
  return status;
}

// ui.js - UI helpers
export function showToast(message) {
  // Show toast notification
}
```

---

# 🔄 Data Flow

```
User Event
    ↓
Controller (setupEventListeners)
    ↓
Service (business logic + saveState)
    ↓
Render (view function)
    ↓
DOM Updated
```

### Ví dụ (Thêm bệnh nhân):
1. **User click "Thêm bệnh nhân"** → Controller `openModal()`
2. **User submit form** → Controller `handleFormSubmit()`
3. **Controller gọi** `patientService.addPatient(data)`
4. **Service xử lý logic** → Thêm vào state → Save localStorage
5. **Controller gọi** `renderPatientView()`
6. **View render HTML**
7. **Controller setup events lại**

---

# ✅ So Sánh: Old vs New

| Khía cạnh | Old Code | New Architecture |
|-----------|----------|------------------|
| **Structure** | 1 file (app.js) ~1500 lines | 20 files tổ chức rõ ràng |
| **Separation** | Trộn lẫn HTML, logic, state | Riêng biệt (Data, Service, View, Controller) |
| **Testing** | Khó test (phụ thuộc DOM) | Dễ test (logic trong services) |
| **Reuse** | Không thể tái sử dụng | Services dùng lại được |
| **Maintain** | Khó (tìm code, sửa phức tạp) | Dễ (biết nó ở đâu, logic tập trung) |
| **Scale** | Không thể mở rộng | Có thể thêm module mới dễ dàng |

---

# 🎯 Quy Tắc Thiết Kế

1. **Không Logic trong Views**
   ```javascript
   // ❌ SAI
   export function renderPatients(container, state) {
     const filtered = state.patients.filter(...); // logic ở view
   }
   
   // ✅ ĐÚNG
   export function renderPatients(container, patients) {
     // Chỉ render, data đã filtered bởi controller
   }
   ```

2. **Views không gọi Services trực tiếp**
   ```javascript
   // ❌ SAI
   export function renderButton(container) {
     button.addEventListener("click", () => {
       patientService.add(...); // service gọi từ view
     });
   }
   
   // ✅ ĐÚNG
   // Controller setup events
   controller.setupButtonClick(() => {
     patientService.add(...);
   });
   ```

3. **Services không biết về DOM**
   ```javascript
   // ❌ SAI
   class PatientService {
     add(data) {
       const el = document.getElementById('result');
       el.innerHTML = 'Added'; // DOM manipulation
     }
   }
   
   // ✅ ĐÚNG
   class PatientService {
     add(data) {
       // Chỉ xử lý logic
       this.state.patients.push(data);
       return { success: true };
     }
   }
   ```

4. **State là Single Source of Truth**
   - Chỉ lưu state một chỗ (stateService)
   - Controllers có local state nhưng read-only (filters, etc.)
   - Services thay đổi state qua stateService

---

# 🚀 Cách Mở Rộng

### Thêm Feature Mới

1. **Tạo file service**
   ```javascript
   // js/services/roomService.js
   class RoomService { ... }
   export default new RoomService();
   ```

2. **Tạo file view**
   ```javascript
   // js/views/roomView.js
   export function renderRoomView(container, rooms) { ... }
   ```

3. **Tạo file controller**
   ```javascript
   // js/controllers/roomController.js
   class RoomController { ... }
   ```

4. **Hook vào appController**
   ```javascript
   // appController.js
   import roomController from "./roomController.js";
   
   class AppController {
     init() {
       roomController.init();
     }
   }
   ```

---

# 💡 Lợi Ích

✅ **Dễ đọc**: Biết mỗi file làm gì  
✅ **Dễ maintain**: Tìm bug cơ bản  
✅ **Dễ test**: Services không phụ thuộc UI  
✅ **Dễ mở rộng**: Thêm module không ảnh hưởng cũ  
✅ **Reusable**: Services dùng lại ở nhiều chỗ  
✅ **Scalable**: Cấu trúc support project lớn  

---

# 📝 Notes

- File `app.js` cũ vẫn giữ lại để tham khảo
- Tất cả modules dùng ES6 import/export
- State được lưu vào localStorage tự động
- Services là singleton (khởi tạo 1 lần)

