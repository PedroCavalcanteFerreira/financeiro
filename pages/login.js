import { api } from "../api.js";

export function bindLogin({ onSuccess }) {
  const btnLogin = document.getElementById("btn-login");
  const userInput = document.getElementById("login-username");
  const passInput = document.getElementById("login-password");
  const errorEl = document.getElementById("login-error");

  btnLogin.addEventListener("click", async () => {
    errorEl.textContent = "";

    const username = userInput.value.trim();
    const password = passInput.value;

    if (!username || !password) {
      errorEl.textContent = "Preencha usuário e senha.";
      return;
    }

    try {
      const res = await api.login(username, password);
      console.log("Resposta login:", res);

      if (!res.ok) {
        errorEl.textContent = res.message || "Erro ao fazer login.";
        return;
      }

      localStorage.setItem("finance_token", res.token);
      localStorage.setItem("finance_user", JSON.stringify(res.user));

      onSuccess(res.user);
    } catch (err) {
      console.error("Erro detalhado no login:", err);
      errorEl.textContent = `Erro de conexão com a API: ${err.message || err}`;
    }
  });
}