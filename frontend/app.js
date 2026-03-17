import { bindLogin } from "./pages/login.js";
import { renderResumo } from "./pages/resumo.js";

const pageLogin = document.getElementById("page-login");
const pageApp = document.getElementById("page-app");
const viewRoot = document.getElementById("view-root");
const userBadge = document.getElementById("user-badge");
const btnLogout = document.getElementById("btn-logout");

function showLogin() {
  pageLogin.classList.add("active");
  pageApp.classList.remove("active");
}

function showApp() {
  pageLogin.classList.remove("active");
  pageApp.classList.add("active");
}

function getStoredUser() {
  const raw = localStorage.getItem("finance_user");
  return raw ? JSON.parse(raw) : null;
}

function clearSession() {
  localStorage.removeItem("finance_token");
  localStorage.removeItem("finance_user");
}

async function navigate(route) {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.route === route);
  });

  if (route === "resumo") {
    await renderResumo(viewRoot);
    return;
  }

  viewRoot.innerHTML = `
    <div class="card">
      <h3>${route}</h3>
      <p class="muted">Página ainda não implementada no front inicial.</p>
    </div>
  `;
}

function setupNavigation() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigate(btn.dataset.route);
    });
  });
}

function doLogout() {
  clearSession();
  showLogin();
}

function initAuthenticatedApp(user) {
  userBadge.textContent = `Usuário: ${user.username}`;
  showApp();
  setupNavigation();
  navigate("resumo");
}

bindLogin({
  onSuccess: initAuthenticatedApp
});

btnLogout.addEventListener("click", doLogout);

const user = getStoredUser();
if (user) {
  initAuthenticatedApp(user);
} else {
  showLogin();
}