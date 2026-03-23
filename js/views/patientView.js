// ============================================
// PATIENT VIEW - Render UI bệnh nhân
// ============================================

import {
  formatPatientStatus,
} from "../utils/formatter.js";
import authService from "../services/authService.js";

export function renderPatientView(container, patients, isModalVisible = false, editingPatient = null) {
  const canCreatePatient = authService.can("patients.create");

  const rows = patients
    .map(
      (p) => `
      <tr>
        <td>${p.name}</td>
        <td>${p.room}</td>
        <td>${p.bed}</td>
        <td><span class="badge ${p.status}">${formatPatientStatus(p.status)}</span></td>
        <td>
          <button class="edit-patient-btn ghost-btn" data-id="${p.id}" ${canCreatePatient ? "" : "disabled title='Bạn không có quyền chỉnh sửa'"}>
            <i class="fa-solid fa-pen" aria-hidden="true"></i><span>Sửa</span>
          </button>
        </td>
      </tr>
    `
    )
    .join("");

  container.innerHTML = `
    <div class="section-head">
      <div>
        <h2>Quản lý bệnh nhân</h2>
        <p>Quản lý bệnh nhân và phòng bệnh</p>
      </div>
    </div>

    <div class="card patient-toolbar-card">
      <div class="filter-group">
        <select id="patient-status-filter">
          <option value="all">Tất cả trạng thái</option>
          <option value="admitted">Nhập viện</option>
          <option value="discharged">Xuất viện</option>
        </select>
        <input id="patient-room-filter" type="text" placeholder="Lọc theo phòng (vd: 101)" />
        <button id="apply-patient-filter" class="ghost-btn" type="button"><i class="fa-solid fa-filter" aria-hidden="true"></i><span>Lọc</span></button>
        <button id="reset-patient-filter" class="ghost-btn" type="button"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i><span>Đặt lại</span></button>
      </div>
      <button id="open-patient-modal" ${canCreatePatient ? "" : "disabled title='Bạn không có quyền thêm bệnh nhân'"}><i class="fa-solid fa-user-plus" aria-hidden="true"></i><span>Thêm bệnh nhân</span></button>
    </div>

    <div class="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tên bệnh nhân</th>
            <th>Số phòng</th>
            <th>Số giường</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          ${rows || "<tr><td colspan='4'>Không có dữ liệu.</td></tr>"}
        </tbody>
      </table>
    </div>

    <div id="patient-modal" class="modal-overlay ${isModalVisible && !editingPatient ? "show" : ""}">
      <div class="modal-card">
        <h3>Thêm bệnh nhân mới</h3>
        <form id="patient-modal-form" class="patient-modal-form">
          <div class="field-wrap">
            <label for="modal-patient-name">Tên bệnh nhân</label>
            <input id="modal-patient-name" name="name" type="text" placeholder="Nhập tên bệnh nhân" required />
          </div>

          <div class="row-2">
            <div class="field-wrap">
              <label for="modal-patient-room">Số phòng</label>
              <input id="modal-patient-room" name="room" type="text" placeholder="e.g., 101" required />
            </div>
            <div class="field-wrap">
              <label for="modal-patient-bed">Số giường</label>
              <input id="modal-patient-bed" name="bed" type="text" placeholder="e.g., A" required />
            </div>
          </div>

          <div class="field-wrap">
            <label for="modal-patient-status">Trạng thái</label>
            <select id="modal-patient-status" name="status" required>
              <option value="admitted">Nhập viện</option>
              <option value="discharged">Xuất viện</option>
            </select>
          </div>

          <div class="modal-actions">
            <button type="button" class="ghost-btn modal-cancel" id="patient-modal-cancel"><i class="fa-solid fa-xmark" aria-hidden="true"></i><span>Hủy</span></button>
            <button type="submit"><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i><span>Lưu</span></button>
          </div>
        </form>
      </div>
    </div>

    <div id="patient-edit-modal" class="modal-overlay ${editingPatient ? "show" : ""}">
      <div class="modal-card">
        <h3>Chỉnh sửa bệnh nhân</h3>
        <form id="patient-edit-modal-form" class="patient-modal-form">
          <input type="hidden" id="edit-patient-id" value="${editingPatient ? editingPatient.id : ""}" />
          
          <div class="field-wrap">
            <label for="edit-patient-name">Tên bệnh nhân</label>
            <input id="edit-patient-name" name="name" type="text" placeholder="Nhập tên bệnh nhân" value="${editingPatient ? editingPatient.name : ""}" required />
          </div>

          <div class="row-2">
            <div class="field-wrap">
              <label for="edit-patient-room">Số phòng</label>
              <input id="edit-patient-room" name="room" type="text" placeholder="e.g., 101" value="${editingPatient ? editingPatient.room : ""}" required />
            </div>
            <div class="field-wrap">
              <label for="edit-patient-bed">Số giường</label>
              <input id="edit-patient-bed" name="bed" type="text" placeholder="e.g., A" value="${editingPatient ? editingPatient.bed : ""}" required />
            </div>
          </div>

          <div class="field-wrap">
            <label for="edit-patient-status">Trạng thái</label>
            <select id="edit-patient-status" name="status" required>
              <option value="admitted" ${editingPatient && editingPatient.status === "admitted" ? "selected" : ""}>Nhập viện</option>
              <option value="discharged" ${editingPatient && editingPatient.status === "discharged" ? "selected" : ""}>Xuất viện</option>
            </select>
          </div>

          <div class="modal-actions">
            <button type="button" class="ghost-btn modal-cancel" id="patient-edit-modal-cancel"><i class="fa-solid fa-xmark" aria-hidden="true"></i><span>Hủy</span></button>
            <button type="submit"><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i><span>Lưu</span></button>
          </div>
        </form>
      </div>
    </div>
  `;
}
