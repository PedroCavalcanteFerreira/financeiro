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

export async function renderInvestimentos(root) {
  const token = localStorage.getItem("finance_token");
  if (!token) {
    throw new Error("Token não encontrado.");
  }

  const [dataRes, cfgRes] = await Promise.all([
    api.getInvestimentosData(token),
    api.getConfigInvestimentos(token)
  ]);

  if (!dataRes.ok) {
    root.innerHTML = `
      <div class="card">
        <h3>Investimentos</h3>
        <p class="muted">Erro ao carregar dados: ${dataRes.message || "erro desconhecido"}</p>
      </div>
    `;
    return;
  }

  if (!cfgRes.ok) {
    root.innerHTML = `
      <div class="card">
        <h3>Investimentos</h3>
        <p class="muted">Erro ao carregar config: ${cfgRes.message || "erro desconhecido"}</p>
      </div>
    `;
    return;
  }

  const data = dataRes.data || {};
  const cfg = cfgRes.data || {};
  const kpis = data.kpis || {};
  const positions = Array.isArray(data.positions) ? data.positions : [];
  const extrato = Array.isArray(data.extrato) ? data.extrato : [];
  const accounts = Array.isArray(cfg.accounts) ? cfg.accounts : [];
  const assetTypes = Array.isArray(cfg.assetTypes) ? cfg.assetTypes : [];
  const txTypes = Array.isArray(cfg.txTypes) ? cfg.txTypes : [];

  root.innerHTML = `
    <section>
      <div class="card">
        <h3>Investimentos</h3>
        <p class="muted">Controle de aportes, movimentações e posição em custo.</p>
      </div>

      <div class="grid grid-kpi" style="margin-top:16px;">
        <div class="card">
          <div class="kpi-label">Patrimônio em custo</div>
          <div class="kpi-value">${brl(kpis.patrimonioCusto)}</div>
        </div>
        <div class="card">
          <div class="kpi-label">Aportado</div>
          <div class="kpi-value">${brl(kpis.totalAportado)}</div>
        </div>
        <div class="card">
          <div class="kpi-label">Resgatado</div>
          <div class="kpi-value">${brl(kpis.totalResgatado)}</div>
        </div>
        <div class="card">
          <div class="kpi-label">Rendimentos</div>
          <div class="kpi-value">${brl(kpis.totalRendimentos)}</div>
        </div>
        <div class="card">
          <div class="kpi-label">Lucro realizado</div>
          <div class="kpi-value">${brl(kpis.lucroRealizado)}</div>
        </div>
      </div>

      <div class="card" style="margin-top:16px;">
        <h3>Nova movimentação</h3>

        <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap:12px;">
          <div>
            <label class="muted">Data</label>
            <input id="inv-date" type="date" value="${todayDate()}" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;" />
          </div>

          <div>
            <label class="muted">Conta de investimento</label>
            <select id="inv-account" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;">
              ${accounts.map(a => `<option value="${a.account_id}">${a.name}</option>`).join("")}
            </select>
          </div>

          <div>
            <label class="muted">Tipo</label>
            <select id="inv-tx-type" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;">
              ${txTypes.map(t => `<option value="${t}">${t}</option>`).join("")}
            </select>
          </div>

          <div>
            <label class="muted">Tipo do ativo</label>
            <select id="inv-asset-type" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;">
              ${assetTypes.map(t => `<option value="${t}">${t}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap:12px; margin-top:12px;">
          <div>
            <label class="muted">Ativo</label>
            <input id="inv-asset" type="text" placeholder="Ex.: HGLG11" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;" />
          </div>

          <div>
            <label class="muted">Quantidade</label>
            <input id="inv-quantity" type="number" step="0.000001" value="0" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;" />
          </div>

          <div>
            <label class="muted">Preço unitário</label>
            <input id="inv-unit-price" type="number" step="0.000001" value="0" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;" />
          </div>

          <div>
            <label class="muted">Valor total</label>
            <input id="inv-amount" type="number" step="0.01" value="0" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;" />
          </div>
        </div>

        <div class="grid" style="grid-template-columns: 1fr; gap:12px; margin-top:12px;">
          <div>
            <label class="muted">Observação</label>
            <input id="inv-notes" type="text" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;" />
          </div>
        </div>

        <div style="margin-top:12px;">
          <button id="inv-save-btn">Salvar movimentação</button>
        </div>
      </div>

      <div class="card" style="margin-top:16px;">
        <h3>Posição consolidada</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Ativo</th>
              <th>Tipo</th>
              <th>Quantidade</th>
              <th>Preço médio</th>
              <th>Investido</th>
              <th>Patrimônio em custo</th>
            </tr>
          </thead>
          <tbody>
            ${positions.map(p => `
              <tr>
                <td>${p.asset || "-"}</td>
                <td>${p.asset_type || "-"}</td>
                <td>${Number(p.quantity || 0).toLocaleString("pt-BR")}</td>
                <td>${brl(p.avg_price)}</td>
                <td>${brl(p.invested_cost)}</td>
                <td>${brl(p.patrimony_at_cost)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="card" style="margin-top:16px;">
        <h3>Extrato</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Conta</th>
              <th>Flow</th>
              <th>Tipo</th>
              <th>Ativo</th>
              <th>Qtd</th>
              <th>PU</th>
              <th>Valor</th>
              <th>Lucro realizado</th>
              <th>Obs.</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${extrato.map(r => `
              <tr>
                <td>${r.date || "-"}</td>
                <td>${r.account || "-"}</td>
                <td>${r.flow || "-"}</td>
                <td>${r.tx_type || "-"}</td>
                <td>${r.asset || "-"}</td>
                <td>${Number(r.quantity || 0).toLocaleString("pt-BR")}</td>
                <td>${brl(r.unit_price)}</td>
                <td>${brl(r.amount)}</td>
                <td>${String(r.tx_type).toUpperCase() === "SELL" ? brl(r.realized_pnl) : "-"}</td>
                <td>${r.notes || "-"}</td>
                <td>
                  <button class="inv-delete-btn" data-id="${r.inv_id}">Excluir</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;

  const txTypeEl = document.getElementById("inv-tx-type");
  const quantityEl = document.getElementById("inv-quantity");
  const unitPriceEl = document.getElementById("inv-unit-price");
  const amountEl = document.getElementById("inv-amount");
  const assetEl = document.getElementById("inv-asset");
  const assetTypeEl = document.getElementById("inv-asset-type");

  function updateFieldBehavior() {
    const txType = String(txTypeEl.value || "").toUpperCase();
    const needsAsset = ["BUY", "SELL", "INCOME"].includes(txType);
    const needsQtyPrice = ["BUY", "SELL"].includes(txType);

    assetEl.disabled = !needsAsset;
    assetTypeEl.disabled = !needsAsset;
    quantityEl.disabled = !needsQtyPrice;
    unitPriceEl.disabled = !needsQtyPrice;

    if (!needsAsset) {
      assetEl.value = "";
      assetTypeEl.value = "OUTRO";
    }

    if (!needsQtyPrice) {
      quantityEl.value = 0;
      unitPriceEl.value = 0;
    }
  }

  txTypeEl.addEventListener("change", updateFieldBehavior);
  updateFieldBehavior();

  document.getElementById("inv-save-btn").addEventListener("click", async () => {
    const txType = String(txTypeEl.value || "").toUpperCase();
    const quantity = Number(quantityEl.value || 0);
    const unitPrice = Number(unitPriceEl.value || 0);
    let amount = Number(amountEl.value || 0);

    if ((txType === "BUY" || txType === "SELL") && amount <= 0) {
      amount = quantity * unitPrice;
    }

    const payload = {
      date: document.getElementById("inv-date").value,
      account_id: document.getElementById("inv-account").value,
      tx_type: txType,
      amount: amount,
      quantity: quantity,
      unit_price: unitPrice,
      asset: document.getElementById("inv-asset").value.trim().toUpperCase(),
      asset_type: document.getElementById("inv-asset-type").value,
      notes: document.getElementById("inv-notes").value,
      status: "CONFIRMED"
    };

    const res = await api.addInvestimento(token, payload);

    if (!res.ok) {
      window.showToast(res.message || "Erro ao salvar movimentação de investimento.", "error");
      return;
    }

    window.showToast("Movimentação de investimento salva com sucesso.", "success");
    await renderInvestimentos(root);
  });

  root.querySelectorAll(".inv-delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const invId = btn.dataset.id;
      const ok = confirm("Deseja excluir esta movimentação de investimento?");
      if (!ok) return;

      const res = await api.deleteInvestimento(token, invId);

      if (!res.ok) {
        window.showToast(res.message || "Erro ao excluir movimentação.", "error");
        return;
      }

      window.showToast("Movimentação de investimento excluída com sucesso.", "success");
      await renderInvestimentos(root);
    });
  });
}