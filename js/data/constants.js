// ============================================
// HẰNG SỐ MENU VÀ QUYỀN HẠN
// ============================================

export const MENU_ITEMS = [
  { key: "patients", label: '<img src="image/patient.png" class="icon-img"> Bệnh nhân' },
  { key: "nurses", label: '<img src="image/nurse.png" class="icon-img"> Y tá' },
  { key: "robots", label: '<img src="image/robot.png" class="icon-img"> Robot' },
  { key: "delivery", label: '<img src="image/medicine.png" class="icon-img"> Giao thuốc' },
  { key: "logs", label: '<img src="image/log.png" class="icon-img"> Nhật ký & Thống kê' },
];

export const ROLE_PERMISSIONS = {
  head_nurse: [
    "patients.create",
    "nurses.create",
    "nurses.edit",
    "nurses.delete",
    "nurses.password",
    "delivery.edit",
    "delivery.start",
    "logs.export",
    "logs.system.view",
  ],
  nurse: ["patients.create", "delivery.edit", "delivery.start"],
};

export const STORAGE_KEY = "smart-hospital-state";

export const DEFAULT_STATE = {
  users: [
    {
      id: 1,
      fullName: "Sarah Johnson",
      username: "headnurse1",
      password: "admin123",
      role: "head_nurse",
      status: "active",
    },
    {
      id: 2,
      fullName: "Linh Tran",
      username: "headnurse2",
      password: "admin456",
      role: "head_nurse",
      status: "active",
    },
    {
      id: 3,
      fullName: "Emily Davis",
      username: "nurse1",
      password: "nurse123",
      role: "nurse",
      status: "active",
    },
    {
      id: 4,
      fullName: "Jennifer Lee",
      username: "nurse2",
      password: "nurse123",
      role: "nurse",
      status: "active",
    },
    {
      id: 5,
      fullName: "Amanda Martinez",
      username: "nurse3",
      password: "nurse123",
      role: "nurse",
      status: "inactive",
    },
  ],
  patients: [
    { id: 1, name: "John Anderson", room: "101", bed: "A", status: "admitted" },
    { id: 2, name: "Maria Garcia", room: "102", bed: "B", status: "admitted" },
    { id: 3, name: "Robert Chen", room: "103", bed: "A", status: "discharged" },
    { id: 4, name: "Michael Brown", room: "105", bed: "B", status: "admitted" },
    { id: 5, name: "David Kim", room: "204", bed: "C", status: "admitted" },
  ],
  deliveryBins: [
    { patientId: "", note: "" },
    { patientId: "", note: "" },
    { patientId: "", note: "" },
    { patientId: "", note: "" },
  ],
  robots: [
    { id: 1, name: "MedBot Alpha", online: true, battery: 85, floor: "2nd", task: "Delivering Room 205" },
    { id: 2, name: "MedBot Beta", online: true, battery: 42, floor: "3rd", task: "Idle - waiting" },
    { id: 3, name: "MedBot Gamma", online: false, battery: 95, floor: "1st", task: "Idle - charging" },
  ],
  deliveryLogs: [
    { id: 1, patient: "John Anderson", nurse: "Emily Davis", robot: "MedBot Alpha", status: "success", date: "2026-03-20" },
    { id: 2, patient: "Maria Garcia", nurse: "Jennifer Lee", robot: "MedBot Beta", status: "success", date: "2026-03-20" },
    { id: 3, patient: "Robert Chen", nurse: "Amanda Martinez", robot: "MedBot Alpha", status: "failed", date: "2026-03-19" },
  ],
  systemLogs: [
    {
      id: 1,
      at: "2026-03-20 08:10",
      actor: "System",
      role: "system",
      module: "system",
      action: "Khởi tạo dữ liệu mẫu",
      result: "success",
      detail: "Tạo dữ liệu dashboard mặc định",
    },
  ],
};
