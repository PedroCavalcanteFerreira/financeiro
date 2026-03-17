import { api } from "../api.js";

function brl(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

export async function renderAssinaturas(root) {
  const token = localStorage.getItem("finance_token");
  if (!token) {
    throw new Error("Token não encontrado.");
  }

  const res = await api.getAssinaturas(token);

  if (!res.ok) {
    root.innerHTML = `
      <div class="card">
        <h3>Assinaturas</h3>
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
          <div class="kpi-label">Total mensal ativo</div>
          <div class="kpi-value">${brl(resumo.totalMensal)}</div>
        </div>
        <div class="card">
          <div class="kpi-label">Total anual</div>
          <div class="kpi-value">${brl(resumo.totalAnual)}</div>
        </div>
        <div class="card">
          <div class="kpi-label">Ativas</div>
          <div class="kpi-value">${resumo.qtdAtivas || 0}</div>
        </div>
        <div class="card">
          <div class="kpi-label">Total cadastradas</div>
          <div class="kpi-value">${resumo.qtdTotal || 0}</div>
        </div>
      </div>

      <div class="card" style="margin-top:16px;">
        <h3>Lista de assinaturas</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Valor</th>
              <th>Dia cobrança</th>
              <th>Cartão</th>
              <th>Status</th>
              <th>Início</th>
              <th>Fim</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.nome || "-"}</td>
                <td>${brl(item.valor)}</td>
                <td>${item.diaCobranca || "-"}</td>
                <td>${item.cartao || "-"}</td>
                <td>${item.status || "-"}</td>
                <td>${item.startDate || "-"}</td>
                <td>${item.endDate || "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}