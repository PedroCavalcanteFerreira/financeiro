import { api } from "../api.js";

function brl(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function qty(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6
  });
}

function todayDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buildOptions(items, selectedValue, includeAllLabel) {
  const opts = [];
  if (includeAllLabel) {
    opts.push(
      `<option value="" ${selectedValue ? "" : "selected"}>${includeAllLabel}</option>`
    );
  }

  items.forEach(item => {
    const value = String(item || "");
    const selected = value === String(selectedValue || "") ? "selected" : "";
    opts.push(`<option value="${escapeHtml(value)}" ${selected}>${escapeHtml(value)}</option>`);
  });

  return opts.join("");
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
        <p class="muted">Erro ao carregar dados: ${escapeHtml(dataRes.message || "erro desconhecido")}</p>
      </div>
    `;
    return;
  }

  if (!cfgRes.ok) {
    root.innerHTML = `
      <div class="card">
        <h3>Investimentos</h3>
        <p class="muted">Erro ao carregar config: ${escapeHtml(cfgRes.message || "erro desconhecido")}</p>
      </div>
    `;
    return;
  }

  renderInvestimentosView(root, token, dataRes.data || {}, cfgRes.data || {}, {
    txType: "",
    assetType: "",
    asset: ""
  });
}

function renderInvestimentosView(root, token, data, cfg, filters) {
  const kpis = data.kpis || {};
  const positions = Array.isArray(data.positions) ? data.positions : [];
  const extrato = Array.isArray(data.extrato) ? data.extrato : [];

  const accounts = Array.isArray(cfg.accounts) ? cfg.accounts : [];
  const assetTypes = Array.isArray(cfg.assetTypes) ? cfg.assetTypes : [];
  const txTypes = Array.isArray(cfg.txTypes) ? cfg.txTypes : [];

  const filterTxType = String(filters?.txType || "").toUpperCase();
  const filterAssetType = String(filters?.assetType || "").toUpperCase();
  const filterAsset = String(filters?.asset || "").trim();
  const normalizedAsset = normalizeText(filterAsset);

  const filteredPositions = positions.filter(p => {
    const okAssetType = !filterAssetType || String(p.asset_type || "").toUpperCase() === filterAssetType;
    const okAsset = !normalizedAsset || normalizeText(p.asset).includes(normalizedAsset);
    return okAssetType && okAsset;
  });

  const filteredExtrato = extrato.filter(r => {
    const okTxType = !filterTxType || String(r.tx_type || "").toUpperCase() === filterTxType;
    const okAssetType = !filterAssetType || String(r.asset_type || "").toUpperCase() === filterAssetType;
    const okAsset = !normalizedAsset || normalizeText(r.asset).includes(normalizedAsset);
    return okTxType && okAssetType && okAsset;
  });

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
            <input
              id="inv-date"
              type="date"
              value="${todayDate()}"
              style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;"
            />
          </div>

          <div>
            <label class="muted">Conta de investimento</label>
            <select
              id="inv-account"
              style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;"
            >
              ${accounts.map(a => `
                <option value="${escapeHtml(a.account_id)}">${escapeHtml(a.name)}</option>
              `).join("")}
            </select>
          </div>

          <div>
            <label class="muted">Tipo</label>
            <select
              id="inv-tx-type"
              style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;"
            >
              ${txTypes.map(t => `
                <option value="${escapeHtml(t)}">${escapeHtml(t)}</option>
              `).join("")}
            </select>
          </div>

          <div>
            <label class="muted">Tipo do ativo</label>
            <select
              id="inv-asset-type"
              style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;"
            >
              ${assetTypes.map(t => `
                <option value="${escapeHtml(t)}">${escapeHtml(t)}</option>
              `).join("")}
            </select>
          </div>
        </div>

        <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap:12px; margin-top:12px;">
          <div>
            <label class="muted">Ativo</label>
            <input
              id="inv-asset"
              type="text"
              placeholder="Ex.: HGLG11"
              style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;"
            />
          </div>

          <div>
            <label class="muted">Quantidade</label>
            <input
              id="inv-quantity"
              type="number"
              step="0.000001"
              value="0"
              style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;"
            />
          </div>

          <div>
            <label class="muted">Preço unitário</label>
            <input
              id="inv-unit-price"
              type="number"
              step="0.000001"
              value="0"
              style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;"
            />
          </div>

          <div>
            <label class="muted">Valor total</label>
            <input
              id="inv-amount"
              type="number"
              step="0.01"
              value="0"
              style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;"
            />
          </div>
        </div>

        <div class="grid" style="grid-template-columns: 1fr; gap:12px; margin-top:12px;">
          <div>
            <label class="muted">Observação</label>
            <input
              id="inv-notes"
              type="text"
              style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;"
            />
          </div>
        </div>

        <div style="margin-top:12px;">
          <button id="inv-save-btn">Salvar movimentação</button>
        </div>
      </div>

      <div class="card" style="margin-top:16px;">
        <h3>Filtros</h3>
        <div class="grid" style="grid-template-columns: 1fr 1fr 1.2fr auto auto; gap:12px; align-items:end;">
          <div>
            <label class="muted">Tipo da movimentação</label>
            <select
              id="inv-filter-tx-type"
              style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;"
            >
              ${buildOptions(txTypes, filterTxType, "Todos")}
            </select>
          </div>

          <div>
            <label class="muted">Tipo do ativo</label>
            <select
              id="inv-filter-asset-type"
              style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;"
            >
              ${buildOptions(assetTypes, filterAssetType, "Todos")}
            </select>
          </div>

          <div>
            <label class="muted">Ativo</label>
            <input
              id="inv-filter-asset"
              type="text"
              value="${escapeHtml(filterAsset)}"
              placeholder="Ex.: HGLG11"
              style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;"
            />
          </div>

          <div>
            <button id="inv-filter-apply-btn" type="button">Aplicar</button>
          </div>

          <div>
            <button id="inv-filter-clear-btn" type="button">Limpar</button>
          </div>
        </div>

        <div class="muted" style="margin-top:12px;">
          Posição: ${filteredPositions.length} de ${positions.length} ativos |
          Extrato: ${filteredExtrato.length} de ${extrato.length} linhas
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
            ${
              filteredPositions.length
                ? filteredPositions.map(p => `
                    <tr>
                      <td>${escapeHtml(p.asset || "-")}</td>
                      <td>${escapeHtml(p.asset_type || "-")}</td>
                      <td>${qty(p.quantity)}</td>
                      <td>${brl(p.avg_price)}</td>
                      <td>${brl(p.invested_cost)}</td>
                      <td>${brl(p.patrimony_at_cost)}</td>
                    </tr>
                  `).join("")
                : `
                    <tr>
                      <td colspan="6" class="muted" style="text-align:center;">Nenhum ativo encontrado com os filtros atuais.</td>
                    </tr>
                  `
            }
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
            ${
              filteredExtrato.length
                ? filteredExtrato.map(r => `
                    <tr>
                      <td>${escapeHtml(r.date || "-")}</td>
                      <td>${escapeHtml(r.account || "-")}</td>
                      <td>${escapeHtml(r.flow || "-")}</td>
                      <td>${escapeHtml(r.tx_type || "-")}</td>
                      <td>${escapeHtml(r.asset || "-")}</td>
                      <td>${qty(r.quantity)}</td>
                      <td>${brl(r.unit_price)}</td>
                      <td>${brl(r.amount)}</td>
                      <td>${String(r.tx_type).toUpperCase() === "SELL" ? brl(r.realized_pnl) : "-"}</td>
                      <td>${escapeHtml(r.notes || "-")}</td>
                      <td>
                        <button class="inv-delete-btn" data-id="${escapeHtml(r.inv_id)}">Excluir</button>
                      </td>
                    </tr>
                  `).join("")
                : `
                    <tr>
                      <td colspan="11" class="muted" style="text-align:center;">Nenhuma movimentação encontrada com os filtros atuais.</td>
                    </tr>
                  `
            }
          </tbody>
        </table>
      </div>
    </section>

    <div
      id="inv-confirm-modal"
      style="
        display:none;
        position:fixed;
        inset:0;
        background:rgba(15,23,42,0.45);
        z-index:9999;
        align-items:center;
        justify-content:center;
        padding:16px;
      "
    >
      <div
        style="
          width:100%;
          max-width:420px;
          background:#fff;
          border-radius:16px;
          box-shadow:0 20px 50px rgba(0,0,0,0.18);
          overflow:hidden;
        "
      >
        <div style="padding:18px 18px 8px 18px;">
          <h3 style="margin:0; font-size:18px;">Confirmar exclusão</h3>
        </div>

        <div style="padding:0 18px 18px 18px;">
          <p id="inv-confirm-modal-message" class="muted" style="margin:0;">
            Deseja excluir esta movimentação de investimento?
          </p>
        </div>

        <div
          style="
            display:flex;
            justify-content:flex-end;
            gap:10px;
            padding:14px 18px 18px 18px;
            border-top:1px solid #eef2f7;
          "
        >
          <button
            id="inv-confirm-modal-cancel"
            type="button"
            style="
              background:#fff;
              color:#1f2937;
              border:1px solid #dbe1e7;
              border-radius:10px;
              padding:10px 14px;
              cursor:pointer;
            "
          >
            Cancelar
          </button>

          <button
            id="inv-confirm-modal-confirm"
            type="button"
            style="
              background:#dc2626;
              color:#fff;
              border:none;
              border-radius:10px;
              padding:10px 14px;
              cursor:pointer;
            "
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  `;

  const txTypeEl = document.getElementById("inv-tx-type");
  const quantityEl = document.getElementById("inv-quantity");
  const unitPriceEl = document.getElementById("inv-unit-price");
  const amountEl = document.getElementById("inv-amount");
  const assetEl = document.getElementById("inv-asset");
  const assetTypeEl = document.getElementById("inv-asset-type");

  const filterTxTypeEl = document.getElementById("inv-filter-tx-type");
  const filterAssetTypeEl = document.getElementById("inv-filter-asset-type");
  const filterAssetEl = document.getElementById("inv-filter-asset");

  const confirmModal = document.getElementById("inv-confirm-modal");
  const confirmModalMessage = document.getElementById("inv-confirm-modal-message");
  const confirmModalCancel = document.getElementById("inv-confirm-modal-cancel");
  const confirmModalConfirm = document.getElementById("inv-confirm-modal-confirm");

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

  function openConfirmModal(message) {
    return new Promise(resolve => {
      confirmModalMessage.textContent = message || "Deseja continuar?";
      confirmModal.style.display = "flex";

      function close(result) {
        confirmModal.style.display = "none";
        confirmModalCancel.removeEventListener("click", onCancel);
        confirmModalConfirm.removeEventListener("click", onConfirm);
        confirmModal.removeEventListener("click", onBackdrop);
        document.removeEventListener("keydown", onKeyDown);
        resolve(result);
      }

      function onCancel() {
        close(false);
      }

      function onConfirm() {
        close(true);
      }

      function onBackdrop(e) {
        if (e.target === confirmModal) {
          close(false);
        }
      }

      function onKeyDown(e) {
        if (e.key === "Escape") {
          close(false);
        }
      }

      confirmModalCancel.addEventListener("click", onCancel);
      confirmModalConfirm.addEventListener("click", onConfirm);
      confirmModal.addEventListener("click", onBackdrop);
      document.addEventListener("keydown", onKeyDown);
    });
  }

  function applyFilters() {
    renderInvestimentosView(root, token, data, cfg, {
      txType: filterTxTypeEl.value || "",
      assetType: filterAssetTypeEl.value || "",
      asset: filterAssetEl.value || ""
    });
  }

  updateFieldBehavior();
  txTypeEl.addEventListener("change", updateFieldBehavior);

  document.getElementById("inv-save-btn").addEventListener("click", async () => {
    const txType = String(txTypeEl.value || "").toUpperCase();
    const quantity = Number(quantityEl.value || 0);
    const unitPrice = Number(unitPriceEl.value || 0);
    const asset = document.getElementById("inv-asset").value.trim().toUpperCase();
    let amount = Number(amountEl.value || 0);

    if ((txType === "BUY" || txType === "SELL") && amount <= 0) {
      amount = quantity * unitPrice;
    }

    if (!document.getElementById("inv-date").value) {
      window.showToast("Informe a data da movimentação.", "error");
      return;
    }

    if (!document.getElementById("inv-account").value) {
      window.showToast("Selecione a conta de investimento.", "error");
      return;
    }

    if (["BUY", "SELL"].includes(txType)) {
      if (!asset) {
        window.showToast("Informe o ativo.", "error");
        return;
      }
      if (quantity <= 0) {
        window.showToast("Informe uma quantidade maior que zero.", "error");
        return;
      }
      if (unitPrice <= 0) {
        window.showToast("Informe um preço unitário maior que zero.", "error");
        return;
      }
    }

    if (txType === "INCOME" && !asset) {
      window.showToast("Informe o ativo do rendimento.", "error");
      return;
    }

    if (amount <= 0) {
      window.showToast("Informe um valor total maior que zero.", "error");
      return;
    }

    const payload = {
      date: document.getElementById("inv-date").value,
      account_id: document.getElementById("inv-account").value,
      tx_type: txType,
      amount: amount,
      quantity: quantity,
      unit_price: unitPrice,
      asset: asset,
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

  document.getElementById("inv-filter-apply-btn").addEventListener("click", applyFilters);

  document.getElementById("inv-filter-clear-btn").addEventListener("click", () => {
    renderInvestimentosView(root, token, data, cfg, {
      txType: "",
      assetType: "",
      asset: ""
    });
  });

  filterAssetEl.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      applyFilters();
    }
  });

  root.querySelectorAll(".inv-delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const invId = btn.dataset.id;
      const ok = await openConfirmModal("Deseja excluir esta movimentação de investimento?");
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