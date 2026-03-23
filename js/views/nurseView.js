// ============================================
// NURSE VIEW - Render UI y tá
// ============================================

import { formatUserRole, formatUserStatus } from "../utils/formatter.js";
import authService from "../services/authService.js";

export function renderNurseView(container, nurses, isModalVisible = false) {
  const canCreateNurse = authService.can("nurses.create");

  const rows = nurses
    .map((u) => {
      const roleClass = u.role === "head_nurse" ? "head" : "nurse";
      const actions = authService.can("nurses.edit") || authService.can("nurses.password") || authService.can("nurses.delete")
        ? `
          <div class="action-row">
            <button class="edit-nurse-btn" data-id="${u.id}"><i class="fa-regular fa-pen-to-square" aria-hidden="true"></i><span>Sửa</span></button>
            <button class="warn change-password-btn" data-id="${u.id}" ${authService.can("nurses.password") ? "" : "disabled title='Không có quyền đổi mật khẩu'"}><i class="fa-solid fa-key" aria-hidden="true"></i><span>Đổi MK</span></button>
            <button class="danger delete-nurse-btn" data-id="${u.id}" ${authService.can("nurses.delete") ? "" : "disabled title='Không có quyền xóa'"}><i class="fa-regular fa-trash-can" aria-hidden="true"></i><span>Xóa</span></button>
          </div>
        `
        : `<span style="color:#7a8fa6;font-size:0.88rem;">Không có quyền</span>`;

      return `
        <tr>
          <td>${u.fullName}</td>
          <td>${u.username}</td>
          <td><span class="badge ${roleClass}">${formatUserRole(u.role)}</span></td>
          <td><span class="badge ${u.status}">${formatUserStatus(u.status)}</span></td>
          <td>${actions}</td>
        </tr>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="section-head">
      <div>
        <h2>Quản lý y tá</h2>
        <p>Y tá trưởng có quyền thêm, sửa, xóa, đổi mật khẩu tài khoản y tá</p>
      </div>
      <button id="open-nurse-modal" ${canCreateNurse ? "" : "disabled title='Không có quyền thêm y tá'"}><i class="fa-solid fa-user-plus" aria-hidden="true"></i><span>Thêm y tá</span></button>
    </div>

    <div class="card patient-toolbar-card">
      <div class="filter-group">
        <select id="nurse-role-filter">
          <option value="all">Tất cả vai trò</option>
          <option value="head_nurse">Y tá trưởng</option>
          <option value="nurse">Y tá</option>
        </select>
        <select id="nurse-status-filter">
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Ngưng hoạt động</option>
        </select>
        <button id="apply-nurse-filter" class="ghost-btn" type="button"><i class="fa-solid fa-filter" aria-hidden="true"></i><span>Lọc</span></button>
        <button id="reset-nurse-filter" class="ghost-btn" type="button"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i><span>Đặt lại</span></button>
      </div>
    </div>

    <div class="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tên y tá</th>
            <th>Tài khoản</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div id="nurse-modal" class="modal-overlay ${isModalVisible ? "show" : ""}">
      <div class="modal-card nurse-modal-card">
        <h3>Thêm tài khoản y tá</h3>
        <form id="nurse-modal-form" class="patient-modal-form">
          <div class="field-wrap">
            <label for="nurse-fullname">Tên y tá</label>
            <input id="nurse-fullname" name="fullName" type="text" placeholder="Nhập tên y tá" required />
          </div>

          <div class="field-wrap">
            <label for="nurse-username">Tài khoản đăng nhập</label>
            <input id="nurse-username" name="username" type="text" placeholder="Nhập username" required />
          </div>

          <div class="field-wrap">
            <label for="nurse-password">Mật khẩu đăng nhập</label>
            <input id="nurse-password" name="password" type="password" placeholder="Nhập mật khẩu" required />
          </div>

          <div class="modal-actions">
            <button type="button" class="ghost-btn modal-cancel" id="nurse-modal-cancel"><i class="fa-solid fa-xmark" aria-hidden="true"></i><span>Hủy</span></button>
            <button type="submit"><i class="fa-solid fa-user-check" aria-hidden="true"></i><span>Lưu tài khoản</span></button>
          </div>
        </form>
      </div>
    </div>
  `;
}
