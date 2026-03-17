import { api } from "../api.js";

function brl(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

export async function renderContas(root) {
  const token = localStorage.getItem("finance_token");
  if (!token) {
    throw new Error("Token não encontrado.");
  }

  const res = await api.getContasAPagar(token);

  if (!res.ok) {
    root.innerHTML = `
      <div class="card">
        <h3>Contas a pagar</h3>
        <p class="muted">Erro ao carregar: ${res.message || "erro desconhecido"}</p>
      </div>
    `;
    return;
  }

  const data = res.data || {};
  const resumo = data.resumo || {};
  const items = Array.isArray(data.items) ? data.items : [];

  root.innerHTML = `
    <section>
      <div class="grid grid-kpi">
        <div class="card">
          <div class="kpi-label">Total a pagar</div>
          <div class="kpi-value">${brl(resumo.total)}</div>
        </div>
        <div class="card">
          <div class="kpi-label">Fixas</div>
          <div class="kpi-value">${brl(resumo.fixas)}</div>
        </div>
        <div class="card">
          <div class="kpi-label">Assinaturas</div>
          <div class="kpi-value">${brl(resumo.assinaturas)}</div>
        </div>
        <div class="card">
          <div class="kpi-label">Faturas</div>
          <div class="kpi-value">${brl(resumo.faturas)}</div>
        </div>
      </div>

      <div class="card" style="margin-top:16px;">
        <h3>Lista de contas a pagar</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Nome</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th>Origem</th>
              <th>Método</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.tipo || "-"}</td>
                <td>${item.nome || "-"}</td>
                <td>${brl(item.valor)}</td>
                <td>${item.vencimento || "-"}</td>
                <td>${item.status || "-"}</td>
                <td>${item.origem || "-"}</td>
                <td>${item.metodo || "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}