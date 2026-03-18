import { api } from "../api.js";

function brl(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function todayDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function renderAssinaturas(root) {
  const token = localStorage.getItem("finance_token");
  if (!token) throw new Error("Token não encontrado.");

  await renderAssinaturasPage(root, token);
}

async function renderAssinaturasPage(root, token) {
  const [res, cfgRes] = await Promise.all([
    api.getAssinaturas(token),
    api.getConfigAssinaturas(token)
  ]);

  if (!res.ok) {
    root.innerHTML = `
      <div class="card">
        <h3>Assinaturas</h3>
        <p class="muted">Erro ao carregar: ${res.message || "erro desconhecido"}</p>
      </div>
    `;
    return;
  }

  if (!cfgRes.ok) {
    root.innerHTML = `
      <div class="card">
        <h3>Assinaturas</h3>
        <p class="muted">Erro ao carregar config: ${cfgRes.message || "erro desconhecido"}</p>
      </div>
    `;
    return;
  }

  const data = res.data || {};
  const resumo = data.resumo || {};
  const items = Array.isArray(data.items) ? data.items : [];
  const cards = Array.isArray(cfgRes.data?.cards) ? cfgRes.data.cards : [];
  const categories = Array.isArray(cfgRes.data?.categories) ? cfgRes.data.categories : [];

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
        <h3>Nova assinatura</h3>
        <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap:12px;">
          <div>
            <label class="muted">Nome</label>
            <input id="sub-name" type="text" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;" />
          </div>
          <div>
            <label class="muted">Valor</label>
            <input id="sub-amount" type="number" step="0.01" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;" />
          </div>
          <div>
            <label class="muted">Dia cobrança</label>
            <input id="sub-billing-day" type="number" min="1" max="31" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;" />
          </div>
          <div>
            <label class="muted">Cartão</label>
            <select id="sub-card" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;">
              ${cards.map(c => `<option value="${c.card_id}">${c.name}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="grid" style="grid-template-columns: repeat(3, 1fr); gap:12px; margin-top:12px;">
          <div>
            <label class="muted">Categoria</label>
            <select id="sub-category" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;">
              ${categories.map(c => `<option value="${c.category_id}">${c.name}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="muted">Início</label>
            <input id="sub-start-date" type="date" value="${todayDate()}" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;" />
          </div>
          <div>
            <label class="muted">Observação</label>
            <input id="sub-notes" type="text" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;" />
          </div>
        </div>

        <div style="margin-top:12px;">
          <button id="sub-save-btn">Salvar assinatura</button>
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
              <th>Ações</th>
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
                <td>
                  <button class="sub-toggle-btn" data-id="${item.subscriptionId}">
                    ${item.status === "Ativa" ? "Desativar" : "Ativar"}
                  </button>
                  <button class="sub-delete-btn" data-id="${item.subscriptionId}" style="margin-left:6px;">
                    Excluir
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;

  document.getElementById("sub-save-btn").addEventListener("click", async () => {
    const payload = {
      name: document.getElementById("sub-name").value,
      amount: Number(document.getElementById("sub-amount").value || 0),
      billing_day: Number(document.getElementById("sub-billing-day").value || 1),
      card_id: document.getElementById("sub-card").value,
      category_id: document.getElementById("sub-category").value,
      active: true,
      start_date: document.getElementById("sub-start-date").value,
      notes: document.getElementById("sub-notes").value
    };

    const saveRes = await api.addAssinatura(token, payload);
    if (!saveRes.ok) {
      alert(saveRes.message || "Erro ao salvar assinatura.");
      return;
    }

    await renderAssinaturasPage(root, token);
  });

  root.querySelectorAll(".sub-toggle-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const subscriptionId = btn.dataset.id;
      const toggleRes = await api.toggleAssinaturaStatus(token, subscriptionId);
      if (!toggleRes.ok) {
        alert(toggleRes.message || "Erro ao atualizar status.");
        return;
      }
      await renderAssinaturasPage(root, token);
    });
  });

  root.querySelectorAll(".sub-delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const subscriptionId = btn.dataset.id;
      const ok = confirm("Deseja excluir esta assinatura?");
      if (!ok) return;

      const deleteRes = await api.deleteAssinatura(token, subscriptionId);
      if (!deleteRes.ok) {
        alert(deleteRes.message || "Erro ao excluir assinatura.");
        return;
      }
      await renderAssinaturasPage(root, token);
    });
  });
}