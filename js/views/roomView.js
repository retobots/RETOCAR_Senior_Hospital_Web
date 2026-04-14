// ============================================
// ROOM VIEW - Render UI phòng bệnh
// ============================================

import authService from "../services/authService.js";

/**
 * Render giao diện danh sách phòng bệnh và số giường
 * @param {HTMLElement} container
 * @param {Array} rooms
 * @param {Function} onRoomClick
 */
export function renderRoomListView(container, rooms, onRoomClick) {
  // Lấy danh sách lầu (tầng) từ số đầu tiên của tên phòng
  const floors = Array.from(new Set(rooms.map(r => String(r.name).trim()[0]))).sort();
  let selectedSort = window.selectedRoomSort || "number";
  // Multi-select filter state
  let selectedFloors = window.selectedRoomFloors || floors;
  // Biến tạm cho popup (để chọn nhiều tầng trước khi áp dụng)
  let selectedFloorsTemp = [...selectedFloors];
  // Gom nhóm phòng theo lầu
  const floorMap = {};
  rooms.forEach(room => {
    const floor = String(room.name).trim()[0];
    if (!floorMap[floor]) floorMap[floor] = [];
    floorMap[floor].push(room);
  });
  // Sắp xếp các lầu
  const sortedFloors = Object.keys(floorMap).sort();
  // Sắp xếp phòng trong từng lầu
  sortedFloors.forEach(f => {
    if (selectedSort === "number") {
      floorMap[f] = floorMap[f].slice().sort((a, b) => parseInt(a.name) - parseInt(b.name));
    } else if (selectedSort === "empty") {
      floorMap[f] = floorMap[f].slice().sort((a, b) => b.beds.filter(bed => !bed.occupied).length - a.beds.filter(bed => !bed.occupied).length);
    } else if (selectedSort === "full") {
      floorMap[f] = floorMap[f].slice().sort((a, b) => {
        const fa = a.beds.filter(bed => !bed.occupied).length === 0 ? 0 : 1;
        const fb = b.beds.filter(bed => !bed.occupied).length === 0 ? 0 : 1;
        return fa - fb;
      });
    }
  });

  // Luôn kiểm tra quyền qua authService để đồng bộ trạng thái
  const isAdmin = authService && authService.can && authService.can("rooms.create");
  container.innerHTML = `
    <div class="section-head" style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
      <div>
        <h2>Quản lý phòng bệnh</h2>
        <p>Quản lý, theo dõi phòng và giường bệnh</p>
      </div>
      <div style="display:flex;gap:10px;align-items:center;white-space:nowrap;">
        <button id="floor-filter-btn" class="ghost-btn" type="button" style="border:1.5px solid #dde8f3;color:#133150;background:#f7fbff;font-weight:600;display:inline-flex;align-items:center;gap:6px;border-radius:16px;padding:8px 22px;box-shadow:0 2px 8px #eaf4ff;transition:all 0.18s;font-size:1.08rem;line-height:1.2;"><img src="image/filter.png" alt="Lọc lầu" class="icon-img" style="width:16px;height:16px;margin-right:6px;vertical-align:middle;"/><span style="font-size:1.08rem;font-weight:600;">Lọc lầu</span></button>
        ${isAdmin ? `<button id="add-room-btn" class="ghost-btn" type="button" style="font-weight:700;background:linear-gradient(120deg, var(--cyan), var(--blue));color:#fff;white-space:nowrap;min-width:140px;padding-left:18px;padding-right:18px;display:inline-flex;align-items:center;gap:8px;border-radius:16px;box-shadow:0 4px 16px #eaf4ff;transition:all 0.18s;"><img src="image/addroom.png" alt="Thêm phòng" class="icon-img" style="width:18px;height:18px;margin-right:8px;vertical-align:middle;"/><span>Thêm phòng</span></button>` : ""}
      </div>
    </div>
      <div id="floor-filter-modal" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.18);z-index:1000;align-items:center;justify-content:center;">
        <div style="background:#fff;padding:38px 38px 28px 38px;border-radius:28px;box-shadow:0 8px 40px #2563eb33;min-width:340px;max-width:96vw;display:flex;flex-direction:column;align-items:center;">
          <h3 style="margin-bottom:22px;font-size:1.35rem;font-weight:800;letter-spacing:0.5px;color:#1e293b;">Chọn lầu muốn hiển thị</h3>
          <div style="display:flex;flex-wrap:wrap;gap:18px 18px;margin-bottom:26px;justify-content:center;">
            ${floors.map(f => `
              <button type="button" class="floor-toggle-btn" data-floor="${f}" style="width:54px;height:54px;display:flex;align-items:center;justify-content:center;border-radius:14px;border:2.5px solid #2563eb;background:${selectedFloors.includes(f)?'#2563eb':'#fff'};color:${selectedFloors.includes(f)?'#fff':'#2563eb'};font-size:1.25rem;font-weight:800;box-shadow:${selectedFloors.includes(f)?'0 2px 8px #2563eb33':'none'};transition:all 0.15s;outline:none;cursor:pointer;">${f}</button>
            `).join('')}
          </div>
          <div style="margin-bottom:24px;width:100%;display:flex;flex-direction:column;align-items:center;">
            <label style="font-size:1.13rem;font-weight:700;margin-bottom:10px;color:#1e293b;">Sắp xếp</label>
            <div style="display:flex;gap:32px;justify-content:center;">
              <label style="display:flex;align-items:center;gap:10px;font-size:1.12rem;font-weight:500;cursor:pointer;">
                <input type="radio" name="room-sort-radio" value="number" ${selectedSort==="number"?"checked":''} style="width:20px;height:20px;accent-color:#2563eb;">
                Số phòng
              </label>
              <label style="display:flex;align-items:center;gap:10px;font-size:1.12rem;font-weight:500;cursor:pointer;">
                <input type="radio" name="room-sort-radio" value="empty" ${selectedSort==="empty"?"checked":''} style="width:20px;height:20px;accent-color:#2563eb;">
                Giường trống nhiều nhất
              </label>
              <label style="display:flex;align-items:center;gap:10px;font-size:1.12rem;font-weight:500;cursor:pointer;">
                <input type="radio" name="room-sort-radio" value="full" ${selectedSort==="full"?"checked":''} style="width:20px;height:20px;accent-color:#2563eb;">
                Phòng đầy
              </label>
            </div>
          </div>
          <div style="display:flex;gap:16px;justify-content:center;width:100%;margin-top:8px;">
            <button id="floor-filter-clear" style="padding:10px 26px;border-radius:10px;border:none;background:#f87171;color:#fff;font-weight:700;font-size:1.08rem;box-shadow:0 2px 8px #f8717133;transition:background 0.2s;">Bỏ lọc</button>
            <button id="floor-filter-cancel" style="padding:10px 26px;border-radius:10px;border:none;background:#e2e8f0;color:#64748b;font-weight:700;font-size:1.08rem;">Hủy</button>
            <button id="floor-filter-apply" style="padding:10px 26px;border-radius:10px;border:none;background:#2563eb;color:#fff;font-weight:800;font-size:1.08rem;box-shadow:0 2px 8px #2563eb33;transition:background 0.2s;">Áp dụng</button>
          </div>
        </div>
      </div>
      ${sortedFloors
        .filter(f => selectedFloors.includes(f))
        .map(f => `
          <div style="margin-top:32px;margin-bottom:10px;">
            <h3 style="margin-bottom:18px;margin-top:0;font-size:1.35rem;font-weight:800;letter-spacing:0.5px;">Lầu ${f}</h3>
            <div class="room-grid-4" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;">
              ${floorMap[f].map(room => {
                const totalBeds = room.beds.length;
                const usedBeds = room.beds.filter(b => b.occupied).length;
                const emptyBeds = totalBeds - usedBeds;
                let statusDot = '<span style="position:absolute;top:18px;right:18px;display:inline-block;width:14px;height:14px;border-radius:50%;background:#22c55e;"></span>';
                let badge = `<span style="background:#d1fae5;color:#059669;padding:4px 14px;border-radius:999px;font-weight:600;font-size:15px;display:inline-block;">${emptyBeds} giường trống</span>`;
                if (emptyBeds === 0) {
                  statusDot = '<span style="position:absolute;top:18px;right:18px;display:inline-block;width:14px;height:14px;border-radius:50%;background:#ef4444;"></span>';
                  badge = `<span style="background:#fee2e2;color:#b91c1c;padding:4px 14px;border-radius:999px;font-weight:600;font-size:15px;display:inline-block;">Đầy</span>`;
                } else if (emptyBeds === 1) {
                  statusDot = '<span style="position:absolute;top:18px;right:18px;display:inline-block;width:14px;height:14px;border-radius:50%;background:#eab308;"></span>';
                  badge = `<span style="background:#fef9c3;color:#b45309;padding:4px 14px;border-radius:999px;font-weight:600;font-size:15px;display:inline-block;">1 giường trống</span>`;
                }
                return `
                <div class="card room-card" data-room-id="${room.id}" style="min-width:270px;max-width:320px;position:relative;padding:28px 24px 24px 24px;">
                  ${statusDot}
                  <div style="display:flex;flex-direction:column;align-items:flex-start;gap:12px;">
                    <div style="background:#f1f5fd;border-radius:12px;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
                      <img src="image/door.png" style="width:32px;height:32px;" />
                    </div>
                    <div style="font-size:1.18rem;font-weight:700;margin-bottom:2px;">Phòng ${room.name}</div>
                    <div style="color:#444;font-size:1.1rem;margin-bottom:2px;">${usedBeds} / ${totalBeds} giường</div>
                    ${badge}
                  </div>
                </div>
                `;
              }).join("")}
            </div>
          </div>
        `).join("")}
  `;
  // Sự kiện click phòng
  container.querySelectorAll('.room-card').forEach(card => {
    card.onclick = () => {
      const roomId = card.getAttribute('data-room-id');
      onRoomClick(roomId);
    };
  });
  // Sự kiện thêm phòng (chỉ gán nếu tồn tại nút)
  const addRoomBtn = container.querySelector('#add-room-btn');
  if (addRoomBtn) {
    addRoomBtn.onclick = () => {
      document.dispatchEvent(new CustomEvent('addRoomClick'));
    };
  }
  // Sự kiện lọc lầu
    // Sự kiện lọc lầu (multi-select)
    const floorFilterBtn = container.querySelector('#floor-filter-btn');
    const floorFilterModal = container.querySelector('#floor-filter-modal');
    if (floorFilterBtn && floorFilterModal) {
      floorFilterBtn.onclick = () => {
        floorFilterModal.style.display = 'flex';
      };
      floorFilterModal.onclick = (e) => {
        if (e.target === floorFilterModal) floorFilterModal.style.display = 'none';
      };
      // Toggle chọn lầu bằng button
      floorFilterModal.querySelectorAll('.floor-toggle-btn').forEach(btn => {
        btn.onclick = () => {
          const f = btn.getAttribute('data-floor');
          if (selectedFloorsTemp.includes(f)) {
            selectedFloorsTemp = selectedFloorsTemp.filter(x => x !== f);
          } else {
            selectedFloorsTemp.push(f);
          }
          // Nếu không chọn lầu nào thì mặc định chọn lại tất cả
          if (selectedFloorsTemp.length === 0) selectedFloorsTemp = [...floors];
          // Cập nhật lại giao diện các nút
          floorFilterModal.querySelectorAll('.floor-toggle-btn').forEach(btn2 => {
            const ff = btn2.getAttribute('data-floor');
            if (selectedFloorsTemp.includes(ff)) {
              btn2.style.background = '#2563eb';
              btn2.style.color = '#fff';
              btn2.style.boxShadow = '0 2px 8px #2563eb33';
            } else {
              btn2.style.background = '#fff';
              btn2.style.color = '#2563eb';
              btn2.style.boxShadow = 'none';
            }
          });
        };
      });
      floorFilterModal.querySelector('#floor-filter-cancel').onclick = () => {
        floorFilterModal.style.display = 'none';
      };
      floorFilterModal.querySelector('#floor-filter-apply').onclick = () => {
        window.selectedRoomFloors = selectedFloorsTemp.length ? selectedFloorsTemp : [...floors];
        // Lấy giá trị radio sort
        const sortValue = floorFilterModal.querySelector('input[name="room-sort-radio"]:checked').value;
        window.selectedRoomSort = sortValue;
        floorFilterModal.style.display = 'none';
        renderRoomListView(container, rooms, onRoomClick);
      };
      floorFilterModal.querySelector('#floor-filter-clear').onclick = () => {
        selectedFloorsTemp = [...floors];
        window.selectedRoomFloors = [...floors];
        floorFilterModal.style.display = 'none';
        renderRoomListView(container, rooms, onRoomClick);
      };
    }
  // Sự kiện sort (chỉ gán nếu có select ngoài popup, hiện tại đã chuyển vào popup nên đoạn này có thể bỏ hoặc kiểm tra tồn tại)
  const sortSelect = container.querySelector('#room-sort-filter');
  if (sortSelect) {
    sortSelect.onchange = (e) => {
      window.selectedRoomSort = e.target.value;
      renderRoomListView(container, rooms, onRoomClick);
    };
  }
}

/**
 * Render giao diện chi tiết phòng và các giường
 * @param {HTMLElement} container
 * @param {Object} room
 * @param {Function} onAddBed
 * @param {Function} onRemoveBed
 */
export function renderRoomDetailView(container, room, onAddBed, onRemoveBed) {
  container.innerHTML = `
    <button id="back-to-room-list" class="ghost-btn" style="margin-bottom:16px;"><i class="fa-solid fa-arrow-left"></i> Quay lại</button>
    <h2>Phòng ${room.name}</h2>
    <div style="margin-bottom:12px;">${room.beds.filter(b => b.occupied).length} / ${room.beds.length} giường đã sử dụng</div>
    <div class="grid-3">
      ${room.beds.map((bed, idx) => {
        let dotColor = bed.occupied ? '#2563eb' : '#10b981';
        let cardBg = bed.occupied ? 'background:#eaf2ff;' : 'background:#fff;';
        let icon = `<img src="image/bedd.png" alt="Bed" style="width:38px;height:38px;object-fit:contain;filter:${bed.occupied ? '' : 'grayscale(0.5) opacity(0.7)'};">`;
        let status = bed.occupied ? `<span style='color:#2563eb;font-weight:700;'>Đang sử dụng</span>` : `<span style='color:#64748b;font-weight:600;'>Trống</span>`;
        let patient = bed.occupied ? `<span style='font-weight:500;color:#222;'>${bed.patientName || ''}</span>` : '';
        let pos = bed.position || { x: '', y: '', theta: '' };
        return `
        <div class="card bed-card" data-bed-idx="${idx}" style="min-width:240px;max-width:320px;position:relative;${cardBg}padding:28px 24px 24px 24px;box-shadow:0 4px 18px #2563eb11;cursor:pointer;">
          <span style="position:absolute;top:18px;right:18px;display:inline-block;width:14px;height:14px;border-radius:50%;background:${dotColor};"></span>
          <div style="display:flex;flex-direction:column;align-items:flex-start;gap:12px;">
            <div style="background:#f1f5fd;border-radius:12px;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
              ${icon}
            </div>
            <div style="font-size:1.18rem;font-weight:700;margin-bottom:2px;">Giường ${idx + 1}</div>
            <div style="font-size:1.08rem;margin-bottom:2px;">${status}</div>
            <div style="margin-top:8px;font-size:15px;color:#444;">${patient}</div>
            <div style="margin-top:10px;font-size:0.98rem;color:#64748b;">
              <b>Vị trí:</b> x: ${pos.x || '-'}, y: ${pos.y || '-'}, θ: ${pos.theta || '-'}
              ${window.authService && window.authService.can && window.authService.can("rooms.edit_position") ? `<button class="edit-bed-pos-btn" data-bed-idx="${idx}" style="margin-left:10px;font-size:0.95rem;padding:2px 10px;border-radius:8px;background:#e0e7ef;color:#23476a;">Sửa vị trí</button>` : ""}
            </div>
          </div>
        </div>
        `;
      }).join("")}
    </div>
    <div id="bed-detail-modal" style="display:none;"></div>
  `;
  // Sự kiện click nút sửa vị trí giường
  container.querySelectorAll('.edit-bed-pos-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      // Chỉ cho phép admin
      const authService = window.authService;
      if (!authService || !authService.can || !authService.can("rooms.edit_position")) {
        alert("Chỉ admin mới được sửa vị trí giường.");
        return;
      }
      const idx = parseInt(btn.getAttribute('data-bed-idx'));
      const bed = room.beds[idx];
      const pos = bed.position || { x: '', y: '', theta: '' };
      const modal = container.querySelector('#bed-detail-modal');
      modal.innerHTML = `
        <div style="position:fixed;inset:0;z-index:9999;background:rgba(30,41,59,0.18);display:flex;align-items:center;justify-content:center;">
          <form id="edit-bed-pos-form" style="background:#fff;border-radius:28px;max-width:420px;width:96vw;padding:38px 38px 28px 38px;box-shadow:0 8px 40px #2563eb33;position:relative;animation:rise 0.18s;">
            <button id='close-edit-bed-pos' type="button" style='position:absolute;top:18px;right:18px;background:none;border:none;font-size:2rem;color:#94a3b8;cursor:pointer;'>&times;</button>
            <h3 style="margin-bottom:18px;">Cập nhật vị trí giường ${idx + 1}</h3>
            <div style="display:flex;gap:16px;margin-bottom:18px;">
              <div><label>x</label><input name="x" type="number" step="any" value="${pos.x}" style="width:80px;margin-left:6px;"></div>
              <div><label>y</label><input name="y" type="number" step="any" value="${pos.y}" style="width:80px;margin-left:6px;"></div>
              <div><label>θ</label><input name="theta" type="number" step="any" value="${pos.theta}" style="width:80px;margin-left:6px;"></div>
            </div>
            <button type="submit" style="background:#2563eb;color:#fff;padding:8px 22px;border-radius:12px;font-weight:700;">Lưu vị trí</button>
          </form>
        </div>
      `;
      modal.style.display = 'block';
      modal.querySelector('#close-edit-bed-pos').onclick = () => {
        modal.style.display = 'none';
        modal.innerHTML = '';
      };
      modal.querySelector('#edit-bed-pos-form').onsubmit = async (ev) => {
        ev.preventDefault();
        const x = parseFloat(ev.target.x.value);
        const y = parseFloat(ev.target.y.value);
        const theta = parseFloat(ev.target.theta.value);
        modal.innerHTML = '<div style="padding:40px;text-align:center;">Đang lưu...</div>';
        try {
          await window.roomService.updateBedPosition(room.id, idx, { x, y, theta });
          modal.innerHTML = '<div style="padding:40px;text-align:center;color:#059669;">Đã lưu vị trí!</div>';
          setTimeout(() => { modal.style.display = 'none'; modal.innerHTML = ''; window.location.reload(); }, 900);
        } catch (err) {
          modal.innerHTML = '<div style="padding:40px;text-align:center;color:#ef4444;">Lỗi khi lưu vị trí!</div>';
        }
      };
    };
  });

  // Sự kiện click vào card giường để mở popup chi tiết
  container.querySelectorAll('.bed-card').forEach(card => {
    card.onclick = () => {
      const idx = parseInt(card.getAttribute('data-bed-idx'));
      const bed = room.beds[idx];
      let dotColor = bed.occupied ? '#2563eb' : '#10b981';
      let icon = `<img src="image/bedd.png" alt="Bed" style="width:38px;height:38px;object-fit:contain;filter:${bed.occupied ? '' : 'grayscale(0.5) opacity(0.7)'};">`;
      if (!bed.occupied) {
        // Nếu giường trống, hiển thị popup tiếng Việt
        const modal = container.querySelector('#bed-detail-modal');
        modal.innerHTML = `
          <div style="position:fixed;inset:0;z-index:9999;background:rgba(30,41,59,0.18);display:flex;align-items:center;justify-content:center;">
            <div style="background:#fff;border-radius:28px;max-width:480px;width:96vw;padding:38px 38px 28px 38px;box-shadow:0 8px 40px #2563eb33;position:relative;animation:rise 0.18s;">
              <button id='close-bed-detail' style='position:absolute;top:18px;right:18px;background:none;border:none;font-size:2rem;color:#94a3b8;cursor:pointer;'>&times;</button>
              <div style='display:flex;align-items:center;gap:14px;margin-bottom:10px;'>
                <span style='background:#f1f5fd;border-radius:12px;width:48px;height:48px;display:flex;align-items:center;justify-content:center;'>${icon}</span>
                <div>
                  <div style='font-size:1.35rem;font-weight:800;color:#133150;'>Giường ${idx + 1}</div>
                  <div style='color:${dotColor};font-size:1.08rem;font-weight:700;display:flex;align-items:center;gap:7px;'><span style='display:inline-block;width:10px;height:10px;border-radius:50%;background:${dotColor};'></span> <span style='color:#10b981;font-weight:700;'>Trống</span></div>
                </div>
              </div>
              <div style='display:flex;flex-direction:column;align-items:center;justify-content:center;margin-top:32px;margin-bottom:32px;'>
                <span style='background:#d1fae5;border-radius:50%;width:64px;height:64px;display:flex;align-items:center;justify-content:center;margin-bottom:18px;'><img src="image/bedd.png" style="width:38px;height:38px;filter:grayscale(0.5) opacity(0.7);" /></span>
                <div style='font-size:1.18rem;font-weight:600;color:#059669;'>Giường này hiện đang trống</div>
              </div>
            </div>
          </div>
        `;
        modal.style.display = 'block';
        // Đóng popup
        modal.querySelector('#close-bed-detail').onclick = () => {
          modal.style.display = 'none';
          modal.innerHTML = '';
        };
        return;
      }
      // ...existing code...
      let status = `<span style='color:#2563eb;font-weight:700;'>Đang sử dụng</span>`;
      let patient = `<span style='font-weight:500;color:#222;'>${bed.patientName || ''}</span>`;
      let age = '—';
      let admissionDate = '—';
      let doctor = '—';
      if (bed.patientName) {
        const patients = window.stateService ? window.stateService.getState().patients : [];
        const p = patients.find(pt => pt.name === bed.patientName && pt.room === room.name && pt.bed === bed.name);
        if (p) {
          if (p.dob) {
            const dob = new Date(p.dob);
            const now = new Date();
            let years = now.getFullYear() - dob.getFullYear();
            const m = now.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years--;
            age = years + ' tuổi';
          }
          if (p.admissionDate) admissionDate = p.admissionDate;
          if (p.doctor) doctor = p.doctor;
        }
      }
      const modal = container.querySelector('#bed-detail-modal');
      modal.innerHTML = `
        <div style="position:fixed;inset:0;z-index:9999;background:rgba(30,41,59,0.18);display:flex;align-items:center;justify-content:center;">
          <div style="background:#fff;border-radius:28px;max-width:480px;width:96vw;padding:38px 38px 28px 38px;box-shadow:0 8px 40px #2563eb33;position:relative;animation:rise 0.18s;">
            <button id='close-bed-detail' style='position:absolute;top:18px;right:18px;background:none;border:none;font-size:2rem;color:#94a3b8;cursor:pointer;'>&times;</button>
            <div style='display:flex;align-items:center;gap:14px;margin-bottom:10px;'>
              <span style='background:#f1f5fd;border-radius:12px;width:48px;height:48px;display:flex;align-items:center;justify-content:center;'>${icon}</span>
              <div>
                <div style='font-size:1.35rem;font-weight:800;color:#133150;'>Giường ${idx + 1}</div>
                <div style='color:${dotColor};font-size:1.08rem;font-weight:700;display:flex;align-items:center;gap:7px;'><span style='display:inline-block;width:10px;height:10px;border-radius:50%;background:${dotColor};'></span> ${status}</div>
              </div>
            </div>
            <div style='margin:18px 0 10px 0;font-size:1.08rem;color:#64748b;'>Tên bệnh nhân</div>
            <div style='font-size:1.18rem;font-weight:600;margin-bottom:18px;'>${bed.patientName || '(Không có tên)'}</div>
            <hr style='margin:18px 0 18px 0;border:none;border-top:1px solid #e2e8f0;'>
            <div style='display:flex;gap:24px;margin-bottom:18px;'>
              <div style='flex:1;'>
                <div style='color:#64748b;font-size:1.02rem;'>Tuổi</div>
                <div style='font-size:1.08rem;font-weight:500;'>${age}</div>
              </div>
              <div style='flex:1;'>
                <div style='color:#64748b;font-size:1.02rem;'>Ngày nhập viện</div>
                <div style='font-size:1.08rem;font-weight:500;'><i class='fa-regular fa-calendar' style='margin-right:6px;'></i>${admissionDate}</div>
              </div>
            </div>
            <div style='color:#64748b;font-size:1.02rem;margin-bottom:4px;'><i class='fa-regular fa-user' style='margin-right:6px;'></i>Bác sĩ phụ trách</div>
            <div style='font-size:1.08rem;font-weight:500;'>${doctor}</div>
          </div>
        </div>
      `;
      modal.style.display = 'block';
      // Đóng popup
      modal.querySelector('#close-bed-detail').onclick = () => {
        modal.style.display = 'none';
        modal.innerHTML = '';
      };
    };
  });
  container.querySelector('#back-to-room-list').onclick = () => {
    document.dispatchEvent(new CustomEvent('backToRoomList'));
  };
}
