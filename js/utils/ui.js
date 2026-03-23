// ============================================
// UI UTILITY - Toast, Modal Helper
// ============================================

let toastElement = null;

// Khởi tạo toast element
function initToast() {
  if (!toastElement) {
    toastElement = document.createElement("div");
    toastElement.className = "toast";
    document.body.appendChild(toastElement);
  }
}

// Hiển thị toast
export function showToast(message) {
  initToast();
  toastElement.textContent = message;
  toastElement.classList.add("show");
  setTimeout(() => toastElement.classList.remove("show"), 1800);
}

// Modal helper
export function openModal(modalElement) {
  if (modalElement) {
    modalElement.classList.add("show");
  }
}

export function closeModal(modalElement) {
  if (modalElement) {
    modalElement.classList.remove("show");
  }
}

// Hỗ trợ đóng modal khi click ngoài
export function setupModalClose(modalElement, closeCallback) {
  if (modalElement) {
    modalElement.addEventListener("click", (event) => {
      if (event.target === modalElement) {
        closeCallback();
      }
    });
  }
}

// Focus first input in modal
export function focusFirstInputInModal(modalElement) {
  if (modalElement) {
    const firstInput = modalElement.querySelector("input[name], textarea[name]");
    if (firstInput) {
      firstInput.focus();
    }
  }
}
