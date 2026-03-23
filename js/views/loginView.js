// ============================================
// LOGIN VIEW - Render login screen
// ============================================

export function renderLoginView(loginScreen) {
  loginScreen.innerHTML = `
    <div class="login-card">
      <div class="logo-badge">+</div>
      <h1>Smart Hospital</h1>
      <p>Thông minh hơn để chăm sóc tốt hơn</p>
      <form id="login-form" class="form-stack">
        <label>Tên đăng nhập</label>
        <input id="username" type="text" placeholder="Nhập tên đăng nhập" required />

        <label>Mật khẩu</label>
        <input id="password" type="password" placeholder="Nhập mật khẩu" required />

        <button type="submit">Đăng nhập</button>
      </form>

      <p id="login-error" class="error-text"></p>
    </div>
  `;
}

export function setLoginError(loginScreen, message) {
  const errorEl = loginScreen.querySelector("#login-error");
  if (errorEl) {
    errorEl.textContent = message;
  }
}

export function clearLoginError(loginScreen) {
  setLoginError(loginScreen, "");
}

export function resetLoginForm(loginScreen) {
  const form = loginScreen.querySelector("#login-form");
  if (form) {
    form.reset();
  }
}
