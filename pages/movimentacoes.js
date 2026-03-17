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

function todayDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
  const [movRes, cfgRes] = await Promise.all([
    api.getMovimentacoes(token, month),
    api.getConfigMovimentacoes(token)
  ]);

  if (!movRes.ok) {
    root.innerHTML = `
      <div class="card">
        <h3>Movimentações</h3>
        <p class="muted">Erro ao carregar: ${movRes.message || "erro desconhecido"}</p>
      </div>
    `;
    return;
  }

  if (!cfgRes.ok) {
    root.innerHTML = `
      <div class="card">
        <h3>Movimentações</h3>
        <p class="muted">Erro ao carregar config: ${cfgRes.message || "erro desconhecido"}</p>
      </div>
    `;
    return;
  }

  const data = movRes.data || {};
  const resumo = data.resumo || {};
  const items = Array.isArray(data.items) ? data.items : [];
  const categories = Array.isArray(cfgRes.data?.categories) ? cfgRes.data.categories : [];
  const methods = Array.isArray(cfgRes.data?.methods) ? cfgRes.data.methods : [];

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
        <h3>Nova movimentação</h3>
        <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap:12px;">
          <div>
            <label class="muted">Data</label>
            <input id="tx-date" type="date" value="${todayDate()}" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;" />
          </div>
          <div>
            <label class="muted">Wallet</label>
            <select id="tx-wallet" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;">
              <option value="CONTA">Conta</option>
              <option value="BENEFICIO">Benefício</option>
            </select>
          </div>
          <div>
            <label class="muted">Fluxo</label>
            <select id="tx-flow" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;">
              <option value="DESPESA">Despesa</option>
              <option value="RECEITA">Receita</option>
            </select>
          </div>
          <div>
            <label class="muted">Valor</label>
            <input id="tx-amount" type="number" step="0.01" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;" />
          </div>
        </div>

        <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap:12px; margin-top:12px;">
          <div>
            <label class="muted">Categoria</label>
            <select id="tx-category" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;">
              ${categories.map(c => `<option value="${c.category_id}">${c.name}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="muted">Método</label>
            <select id="tx-method" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;">
              ${methods.map(m => `<option value="${m.payment_method_id}">${m.name}</option>`).join("")}
            </select>
          </div>
          <div style="grid-column: span 2;">
            <label class="muted">Descrição</label>
            <input id="tx-description" type="text" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;" />
          </div>
        </div>

        <div style="margin-top:12px;">
          <button id="tx-save-btn">Salvar movimentação</button>
        </div>
      </div>

      <div class="card" style="margin-top:16px;">
        <h3>Tabela de movimentações</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Wallet</th>
              <th>Fluxo</th>
              <th>Valor</th>
              <th>Categoria</th>
              <th>Método</th>
              <th>Descrição</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.date || "-"}</td>
                <td>${item.wallet || "-"}</td>
                <td>${item.flow || "-"}</td>
                <td>${brl(item.amount)}</td>
                <td>${item.category || "-"}</td>
                <td>${item.paymentMethod || "-"}</td>
                <td>${item.description || "-"}</td>
                <td>${item.status || "-"}</td>
                <td>
                  <button class="tx-status-btn" data-id="${item.txId}" data-next="${String(item.status).toUpperCase() === "PAID" ? "PENDING" : "PAID"}">
                    ${String(item.status).toUpperCase() === "PAID" ? "Marcar pendente" : "Marcar pago"}
                  </button>
                  <button class="tx-delete-btn" data-id="${item.txId}" style="margin-left:6px;">Excluir</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;

  document.getElementById("mov-filter-btn").addEventListener("click", async () => {
    const newMonth = document.getElementById("mov-month").value || getCurrentMonth();
    await renderMovimentacoesByMonth(root, token, newMonth);
  });

  document.getElementById("tx-save-btn").addEventListener("click", async () => {
    const payload = {
      date: document.getElementById("tx-date").value,
      wallet: document.getElementById("tx-wallet").value,
      flow: document.getElementById("tx-flow").value,
      amount: Number(document.getElementById("tx-amount").value || 0),
      category_id: document.getElementById("tx-category").value,
      payment_method_id: document.getElementById("tx-method").value,
      description: document.getElementById("tx-description").value,
      status: "PAID"
    };

    const res = await api.addMovimentacao(token, payload);
    if (!res.ok) {
      alert(res.message || "Erro ao salvar movimentação.");
      return;
    }

    await renderMovimentacoesByMonth(root, token, document.getElementById("mov-month").value || getCurrentMonth());
  });

  root.querySelectorAll(".tx-delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const txId = btn.dataset.id;
      const ok = confirm("Deseja excluir esta movimentação?");
      if (!ok) return;

      const res = await api.deleteMovimentacao(token, txId);
      if (!res.ok) {
        alert(res.message || "Erro ao excluir.");
        return;
      }

      await renderMovimentacoesByMonth(root, token, document.getElementById("mov-month").value || getCurrentMonth());
    });
  });

  root.querySelectorAll(".tx-status-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const txId = btn.dataset.id;
      const nextStatus = btn.dataset.next;

      const res = await api.updateMovimentacaoStatus(token, txId, nextStatus);
      if (!res.ok) {
        alert(res.message || "Erro ao atualizar status.");
        return;
      }

      await renderMovimentacoesByMonth(root, token, document.getElementById("mov-month").value || getCurrentMonth());
    });
  });
}