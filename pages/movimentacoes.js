import { api } from "../api.js";

function brl(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function getCurrentMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function renderMovimentacoes(root) {
  const token = localStorage.getItem("finance_token");
  if (!token) {
    throw new Error("Token não encontrado.");
  }

  const selectedMonth = getCurrentMonth();
  await renderMovimentacoesByMonth(root, token, selectedMonth);
}

async function renderMovimentacoesByMonth(root, token, month) {
  const res = await api.getMovimentacoes(token, month);

  if (!res.ok) {
    root.innerHTML = `
      <div class="card">
        <h3>Movimentações</h3>
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
      <div class="card">
        <h3>Movimentações</h3>
        <div style="margin-top:12px;">
          <label class="muted">Mês</label><br/>
          <input id="mov-month" type="month" value="${data.filtro?.month || month}" style="margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;" />
          <button id="mov-filter-btn" style="margin-left:8px;">Aplicar</button>
        </div>
      </div>

      <div class="grid grid-kpi" style="margin-top:16px;">
        <div class="card">
          <div class="kpi-label">Receitas</div>
          <div class="kpi-value">${brl(resumo.totalReceitas)}</div>
        </div>
        <div class="card">
          <div class="kpi-label">Despesas</div>
          <div class="kpi-value">${brl(resumo.totalDespesas)}</div>
        </div>
        <div class="card">
          <div class="kpi-label">Saldo</div>
          <div class="kpi-value">${brl(resumo.saldo)}</div>
        </div>
        <div class="card">
          <div class="kpi-label">Quantidade</div>
          <div class="kpi-value">${resumo.quantidade || 0}</div>
        </div>
      </div>

      <div class="card" style="margin-top:16px;">
        <h3>Tabela de movimentações</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Mês</th>
              <th>Wallet</th>
              <th>Fluxo</th>
              <th>Valor</th>
              <th>Categoria</th>
              <th>Método</th>
              <th>Descrição</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.date || "-"}</td>
                <td>${item.month || "-"}</td>
                <td>${item.wallet || "-"}</td>
                <td>${item.flow || "-"}</td>
                <td>${brl(item.amount)}</td>
                <td>${item.category || "-"}</td>
                <td>${item.paymentMethod || "-"}</td>
                <td>${item.description || "-"}</td>
                <td>${item.status || "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;

  const btn = document.getElementById("mov-filter-btn");
  const monthInput = document.getElementById("mov-month");

  btn.addEventListener("click", async () => {
    const newMonth = monthInput.value || getCurrentMonth();
    await renderMovimentacoesByMonth(root, token, newMonth);
  });
}