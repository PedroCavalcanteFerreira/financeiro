import { bindLogin } from "./pages/login.js";
import { renderResumo } from "./pages/resumo.js";
import { renderCartoes } from "./pages/cartoes.js";
import { renderContas } from "./pages/contas.js";
import { renderAssinaturas } from "./pages/assinaturas.js";
import { renderMovimentacoes } from "./pages/movimentacoes.js";

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

  try {
    if (route === "resumo") {
      viewRoot.innerHTML = `
        <div class="card">
          <h3>Resumo</h3>
          <p class="muted">Carregando...</p>
        </div>
      `;
      await renderResumo(viewRoot);
      return;
    }

    if (route === "cartoes") {
      viewRoot.innerHTML = `
        <div class="card">
          <h3>Cartões</h3>
          <p class="muted">Carregando...</p>
        </div>
      `;
      await renderCartoes(viewRoot);
      return;
    }

    if (route === "contas") {
      viewRoot.innerHTML = `
        <div class="card">
          <h3>Contas a pagar</h3>
          <p class="muted">Carregando...</p>
        </div>
      `;
      await renderContas(viewRoot);
      return;
    }

    if (route === "assinaturas") {
      viewRoot.innerHTML = `
        <div class="card">
          <h3>Assinaturas</h3>
          <p class="muted">Carregando...</p>
        </div>
      `;
      await renderAssinaturas(viewRoot);
      return;
    }

    if (route === "movimentacoes") {
      viewRoot.innerHTML = `
        <div class="card">
          <h3>Movimentações</h3>
          <p class="muted">Carregando...</p>
        </div>
      `;
      await renderMovimentacoes(viewRoot);
      return;
    }

    viewRoot.innerHTML = `
      <div class="card">
        <h3>${route}</h3>
        <p class="muted">Página ainda não implementada no front inicial.</p>
      </div>
    `;
  } catch (err) {
    console.error("Erro ao navegar/renderizar:", err);
    viewRoot.innerHTML = `
      <div class="card">
        <h3>Erro ao carregar página</h3>
        <p class="muted">${err?.message || err}</p>
      </div>
    `;
  }
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