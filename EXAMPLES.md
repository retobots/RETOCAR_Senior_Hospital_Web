// ============================================
// HƯỚNG DẪN THỰC HÀNH - CODE EXAMPLES
// ============================================

## 📚 Ví Dụ So Sánh: Old vs New

### 1️⃣ THÊM BỆNH NHÂN

**Old Code (app.js - trộn lẫn)**
```javascript
// Constants, state, logic, UI tất cả ở 1 file
function handlePatientModalSubmit(event) {
  event.preventDefault();
  if (!can("patients.create")) {
    addSystemLog("patients", "Thêm bệnh nhân", "denied", "Không đủ quyền");
    showToast("Bạn không có quyền thêm bệnh nhân.");
    return;
  }

  const form = event.currentTarget;
  const name = form.name.value.trim();
  // ... more validation ...

  const nextId = state.patients.length
    ? Math.max(...state.patients.map((p) => p.id)) + 1
    : 1;
  state.patients.push({
    id: nextId,
    name,
    room,
    bed,
    status,
  });
  
  saveState();
  addSystemLog("patients", "Thêm bệnh nhân", "success", `${name} - phòng ${room}`);
  isPatientModalVisible = false;
  renderPatients(); // Re-render & re-attach all listeners
  showToast("Đã thêm bệnh nhân.");
}
```

**New Code (tách biệt)**

```javascript
// 1. Service (js/services/patientService.js)
class PatientService {
  addPatient(patientData) {
    if (!authService.can("patients.create")) {
      logService.addSystemLog("patients", "Thêm bệnh nhân", "denied", "Không đủ quyền");
      return { success: false, message: "Không có quyền thêm bệnh nhân." };
    }

    const { name, room, bed, status } = patientData;
    if (!name || !room || !bed) {
      return { success: false, message: "Vui lòng nhập đủ thông tin." };
    }

    const state = stateService.getState();
    const nextId = state.patients.length ? Math.max(...state.patients.map((p) => p.id)) + 1 : 1;

    state.patients.push({ id: nextId, name, room, bed, status });
    stateService.saveState();
    logService.addSystemLog("patients", "Thêm bệnh nhân", "success", `${name} - phòng ${room}`);
    
    return { success: true, message: "Đã thêm bệnh nhân." };
  }
}

// 2. View (js/views/patientView.js)
export function renderPatientView(container, patients, isModalVisible = false) {
  container.innerHTML = `
    <form id="patient-modal-form" class="patient-modal-form">
      <div class="field-wrap">
        <label for="modal-patient-name">Tên bệnh nhân</label>
        <input id="modal-patient-name" name="name" type="text" required />
      </div>
      ... other fields ...
    </form>
  `;
  // Chỉ render HTML, không setup events
}

// 3. Controller (js/controllers/patientController.js)
class PatientController {
  handleFormSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;

    const result = patientService.addPatient({
      name: form.name.value.trim(),
      room: form.room.value.trim(),
      bed: form.bed.value.trim(),
      status: form.status.value,
    });

    if (!result.success) {
      showToast(result.message);
      return;
    }

    showToast(result.message);
    this.closeModal();
  }
}
```

**So sánh:**
- Old: 1 function, 40+ dòng, trộn logic + validation + UI + state
- New: 3 phần riêng, mỗi phần ~10 dòng, dễ hiểu & maintain

---

### 2️⃣ FILTER BỆNH NHÂN

**Old Code**
```javascript
function renderPatients() {
  const query = globalSearch.value.trim().toLowerCase();
  const rows = state.patients
    .filter((p) => {
      const matchedSearch = [p.name, p.room, p.bed, p.status]
        .join(" ")
        .toLowerCase()
        .includes(query);
      const matchedStatus = patientFilters.status === "all" || p.status === patientFilters.status;
      const matchedRoom = !patientFilters.room || 
        p.room.toLowerCase().includes(patientFilters.room.toLowerCase());
      return matchedSearch && matchedStatus && matchedRoom;
    })
    .map((p) => `<tr>...</tr>`)
    .join("");
  
  // Render HTML + Setup events
  viewMap.patients.innerHTML = `...${rows}...`;
  
  const patientStatusFilter = document.getElementById("patient-status-filter");
  if (patientStatusFilter) {
    patientStatusFilter.value = patientFilters.status;
  }
  // ... more event setup ...
}
```

**New Code**

```javascript
// Service có logic filter
class PatientService {
  filterPatients(filters = {}) {
    let patients = this.getPatients();
    
    if (filters.status && filters.status !== "all") {
      patients = patients.filter((p) => p.status === filters.status);
    }
    
    if (filters.room && filters.room.trim()) {
      const room = filters.room.toLowerCase();
      patients = patients.filter((p) => p.room.toLowerCase().includes(room));
    }
    
    if (filters.search && filters.search.trim()) {
      const query = filters.search.toLowerCase();
      patients = patients.filter((p) => {
        const text = [p.name, p.room, p.bed, p.status].join(" ").toLowerCase();
        return text.includes(query);
      });
    }
    
    return patients;
  }
}

// Controller điều phối
class PatientController {
  renderView(searchQuery = "") {
    const filteredPatients = patientService.filterPatients({
      status: this.filters.status,
      room: this.filters.room,
      search: searchQuery,
    });

    renderPatientView(this.viewContainer, filteredPatients, this.isModalVisible);
    this.setupEventListeners();
  }
}
```

**Lợi ích:**
- Logic filter độc lập (có thể test)
- Reuse filter ở nhiều chỗ
- Dễ thay đổi logic filter mà không ảnh hưởng UI

---

### 3️⃣ QUẢN LÝ STATE

**Old Code**
```javascript
let state = loadState();
let currentUser = null;
let activeView = "patients";
let isPatientModalVisible = false;
let patientSearchTerm = "";
let isNurseModalVisible = false;
let patientFilters = { status: "all", room: "" };
let nurseFilters = { role: "all", status: "all" };
let logFilters = { result: "all", module: "all", date: "" };
let activeLogTab = "delivery";

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
```

**New Code**

```javascript
// Service quản lý state
class StateService {
  constructor() {
    this.state = this.loadState();
    this.listeners = [];
  }

  loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    try {
      return JSON.parse(raw);
    } catch {
      return structuredClone(DEFAULT_STATE);
    }
  }

  saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    this.notifyListeners();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  getState() {
    return this.state;
  }
}

// Controllers quản lý local state
class PatientController {
  constructor() {
    this.filters = { status: "all", room: "" }; // Local state
    this.isModalVisible = false;
  }
}
```

**Lợi ích:**
- State tập trung ở 1 chỗ
- Có thể subscribe thay đổi
- Dễ debug (check stateService.getState())

---

### 4️⃣ PERMISSION CHECKING

**Old Code**
```javascript
function renderNurses() {
  const canCreateNurse = can("nurses.create");
  
  const rows = state.users.map((u) => {
    const actions = can("nurses.edit") || can("nurses.password") || can("nurses.delete")
      ? `<div class="action-row">...</div>`
      : `<span>Không có quyền</span>`;
    return `<tr>...</tr>`;
  });
  
  viewMap.nurses.innerHTML = `
    <button onclick="createNurse()" ${canCreateNurse ? "" : "disabled"}></button>
  `;
}

function can(permission) {
  if (!currentUser) return false;
  const granted = ROLE_PERMISSIONS[currentUser.role] || [];
  return granted.includes(permission);
}
```

**New Code**

```javascript
// Service quản lý auth
class AuthService {
  can(permission) {
    if (!this.currentUser) return false;
    const granted = ROLE_PERMISSIONS[this.currentUser.role] || [];
    return granted.includes(permission);
  }
}

// View nhận authorized state
export function renderNurseView(container, nurses, isModalVisible = false) {
  const canCreateNurse = authService.can("nurses.create");
  
  const rows = nurses.map((u) => {
    const actions = authService.can("nurses.edit") || authService.can("nurses.password") || authService.can("nurses.delete")
      ? `<button data-id="${u.id}">Sửa</button>...`
      : `<span>Không có quyền</span>`;
    return `<tr>...</tr>`;
  });
  
  container.innerHTML = `
    <button id="open-nurse-modal" ${canCreateNurse ? "" : "disabled"}></button>
  `;
}
```

**Lợi ích:**
- Permission logic tập trung
- Dễ thay đổi quy tắc quyền
- View không cần biết logic permission

---

### 5️⃣ EVENT HANDLING

**Old Code**
```javascript
// Events setup ở render function (rất xấu!)
function renderPatients() {
  viewMap.patients.innerHTML = `...`;
  
  const patientStatusFilter = document.getElementById("patient-status-filter");
  if (patientStatusFilter) {
    patientStatusFilter.value = patientFilters.status;
  }
  
  const applyPatientFilterBtn = document.getElementById("apply-patient-filter");
  if (applyPatientFilterBtn && patientStatusFilter && patientRoomFilter) {
    applyPatientFilterBtn.addEventListener("click", () => {
      patientFilters.status = patientStatusFilter.value;
      patientFilters.room = patientRoomFilter.value.trim();
      renderPatients(); // Re-render = re-attach all listeners (memory leak risk!)
    });
  }
}
```

**New Code**

```javascript
// Render + Setup riêng biệt
class PatientController {
  renderView(searchQuery = "") {
    const filteredPatients = patientService.filterPatients({...});
    
    // 1. Render view (HTML only)
    renderPatientView(this.viewContainer, filteredPatients, this.isModalVisible);
    
    // 2. Setup events (separate, clean)
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Apply filter
    const applyBtn = this.viewContainer.querySelector("#apply-patient-filter");
    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        this.filters.status = statusFilter.value;
        this.filters.room = roomFilter.value.trim();
        this.renderView(); // Re-render + re-setup (clean)
      });
    }
  }
}
```

**Lợi ích:**
- Events setup rõ ràng
- Dễ debug (biết events setup ở đâu)
- Tránh memory leak

---

## 🎯 Thực Hành

### Bài 1: Thêm Status Filter cho Robot

```javascript
// Step 1: Thêm filter logic vào RobotService
class RobotService {
  filterRobots(filters = {}) {
    let robots = this.getRobots();
    if (filters.status) {
      if (filters.status === "online") {
        robots = robots.filter(r => r.online);
      } else if (filters.status === "offline") {
        robots = robots.filter(r => !r.online);
      }
    }
    return robots;
  }
}

// Step 2: Update RobotView để hiển thị filter
export function renderRobotView(container, robots, stats) {
  container.innerHTML = `
    <select id="robot-status-filter">
      <option value="">Tất cả</option>
      <option value="online">Online</option>
      <option value="offline">Offline</option>
    </select>
    ...
  `;
}

// Step 3: Update RobotController để setup event
class RobotController {
  setupEventListeners() {
    const filter = this.viewContainer.querySelector("#robot-status-filter");
    if (filter) {
      filter.addEventListener("change", () => {
        this.filters.status = filter.value;
        this.renderView();
      });
    }
  }
}
```

---

## 💡 Best Practices

1. **Services không biết DOM**
   ```javascript
   // ❌ SAI
   addPatient(data) {
     element.innerHTML = 'Added';
   }
   
   // ✅ ĐÚNG
   addPatient(data) {
     return { success: true };
   }
   ```

2. **Views là pure functions**
   ```javascript
   // ❌ SAI
   export function renderPatients(container, state) {
     const filtered = state.patients.filter(...);
   }
   
   // ✅ ĐÚNG
   export function renderPatients(container, patients) {
     // Data đã filtered
   }
   ```

3. **Controllers setup events sau render**
   ```javascript
   // ❌ SAI
   button.addEventListener('click', () => {
     renderView(); // Render lại = setup events lại (leak)
   });
   
   // ✅ ĐÚNG
   this.renderView(); // Render + setup vào function
   ```

4. **State là single source of truth**
   ```javascript
   // ❌ SAI
   let count = 5;
   state.count = 5;
   
   // ✅ ĐÚNG
   // Chỉ dùng state.count ở khắp nơi
   ```

