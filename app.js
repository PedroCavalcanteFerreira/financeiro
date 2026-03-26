import { api } from "./api.js";
import { bindLogin } from "./pages/login.js";
import { renderResumo } from "./pages/resumo.js";
import { renderCartoes } from "./pages/cartoes.js";
import { renderContas } from "./pages/contas.js";
import { renderAssinaturas } from "./pages/assinaturas.js";
import { renderMovimentacoes } from "./pages/movimentacoes.js";
import { renderInvestimentos } from "./pages/investimentos.js";

const pageLogin = document.getElementById("page-login");
const pageApp = document.getElementById("page-app");
const viewRoot = document.getElementById("view-root");
const userBadge = document.getElementById("user-badge");
const btnLogout = document.getElementById("btn-logout");

let navigationBound = false;
let currentRoute = null;
let syncTimer = null;
let lastDataVersion = null;
let isNavigating = false;

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

function renderLoading(route) {
  const titles = {
    resumo: "Resumo",
    cartoes: "Cartões",
    contas: "Contas a pagar",
    assinaturas: "Assinaturas",
    movimentacoes: "Movimentações"
  };

  viewRoot.innerHTML = `
    <div class="card">
      <h3>${titles[route] || route}</h3>
      <p class="muted">Carregando...</p>
    </div>
  `;
}

function getRouteRenderer(route) {
  if (route === "resumo") return renderResumo;
  if (route === "cartoes") return renderCartoes;
  if (route === "contas") return renderContas;
  if (route === "assinaturas") return renderAssinaturas;
  if (route === "movimentacoes") return renderMovimentacoes;
  if (route === "investimentos") return renderInvestimentos;
  return null;
}

async function navigate(route, options = {}) {
  const showLoading = options.showLoading !== false;
  const renderer = getRouteRenderer(route);

  currentRoute = route;

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.route === route);
  });

  if (!renderer) {
    viewRoot.innerHTML = `
      <div class="card">
        <h3>${route}</h3>
        <p class="muted">Página ainda não implementada no front inicial.</p>
      </div>
    `;
    return;
  }

  if (isNavigating) return;
  isNavigating = true;

  try {
    if (showLoading) {
      renderLoading(route);
    }

    await renderer(viewRoot);
  } catch (err) {
    console.error("Erro ao navegar/renderizar:", err);
    viewRoot.innerHTML = `
      <div class="card">
        <h3>Erro ao carregar página</h3>
        <p class="muted">${err?.message || err}</p>
      </div>
    `;
  } finally {
    isNavigating = false;
  }
}

function setupNavigation() {
  if (navigationBound) return;
  navigationBound = true;

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigate(btn.dataset.route);
    });
  });
}

function doLogout() {
  stopAutoSync();
  clearSession();
  showLogin();
}

async function fetchCurrentDataVersion() {
  const token = localStorage.getItem("finance_token");
  if (!token) return null;

  try {
    const res = await api.getDataVersion(token);
    if (!res.ok) return null;
    return String(res.version || "");
  } catch (err) {
    console.error("Erro ao consultar versão dos dados:", err);
    return null;
  }
}

function canAutoRefreshCurrentView() {
  const active = document.activeElement;
  if (!active) return true;

  const tag = String(active.tagName || "").toUpperCase();
  const isEditingField = ["INPUT", "TEXTAREA", "SELECT"].includes(tag);

  if (!isEditingField) return true;
  return !viewRoot.contains(active);
}

async function checkForRemoteUpdates() {
  if (document.hidden) return;
  if (!currentRoute) return;
  if (isNavigating) return;

  const token = localStorage.getItem("finance_token");
  if (!token) return;

  const version = await fetchCurrentDataVersion();
  if (!version) return;

  if (lastDataVersion === null) {
    lastDataVersion = version;
    return;
  }

  if (version !== lastDataVersion) {
    lastDataVersion = version;

    if (!canAutoRefreshCurrentView()) {
      return;
    }

    await navigate(currentRoute, { showLoading: false });
  }
}

function startAutoSync() {
  stopAutoSync();

  fetchCurrentDataVersion().then((version) => {
    lastDataVersion = version;
  });

  syncTimer = setInterval(checkForRemoteUpdates, 3000);

  document.addEventListener("visibilitychange", handleVisibilityRefresh);
}

function stopAutoSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }

  document.removeEventListener("visibilitychange", handleVisibilityRefresh);
  lastDataVersion = null;
}

async function handleVisibilityRefresh() {
  if (!document.hidden) {
    await checkForRemoteUpdates();
  }
}

function initAuthenticatedApp(user) {
  userBadge.textContent = `Usuário: ${user.username}`;
  showApp();
  setupNavigation();
  startAutoSync();
  navigate("resumo");
}

window.showToast = function(message, type = "success") {
  let toast = document.getElementById("app-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "app-toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
};

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