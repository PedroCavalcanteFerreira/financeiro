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
  const [movRes, cfgRes, creditoRes] = await Promise.all([
    api.getMovimentacoes(token, month),
    api.getConfigMovimentacoes(token),
    api.getComprasCredito(token, month)
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

  if (!creditoRes.ok) {
    root.innerHTML = `
      <div class="card">
        <h3>Movimentações</h3>
        <p class="muted">Erro ao carregar compras no crédito: ${creditoRes.message || "erro desconhecido"}</p>
      </div>
    `;
    return;
  }

  const data = movRes.data || {};
  const resumo = data.resumo || {};
  const items = Array.isArray(data.items) ? data.items : [];
  const creditData = creditoRes.data || {};
  const creditItems = Array.isArray(creditData.items) ? creditData.items : [];

  const categories = Array.isArray(cfgRes.data?.categories) ? cfgRes.data.categories : [];
  const methods = Array.isArray(cfgRes.data?.methods) ? cfgRes.data.methods : [];
  const accounts = Array.isArray(cfgRes.data?.accounts) ? cfgRes.data.accounts : [];
  const cards = Array.isArray(cfgRes.data?.cards) ? cfgRes.data.cards : [];

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

          <div>
            <label class="muted">Categoria</label>
            <select id="tx-category" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;"></select>
          </div>
        </div>

        <div class="grid" style="grid-template-columns: repeat(5, 1fr); gap:12px; margin-top:12px;">
          <div id="tx-method-wrap">
            <label class="muted">Forma de pagamento</label>
            <select id="tx-method" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;"></select>
          </div>

          <div id="tx-account-wrap">
            <label class="muted">Conta</label>
            <select id="tx-account" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;"></select>
          </div>

          <div id="tx-card-wrap" style="display:none;">
            <label class="muted">Cartão</label>
            <select id="tx-card" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;"></select>
          </div>

          <div id="tx-installments-wrap" style="display:none;">
            <label class="muted">Parcelas</label>
            <input id="tx-installments" type="number" min="1" value="1" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;" />
          </div>

          <div id="tx-card-bill-partial-wrap" style="display:none;">
            <label class="muted">Pagamento parcial?</label>
            <div style="margin-top:12px; display:flex; align-items:center; gap:8px;">
              <input id="tx-card-bill-partial" type="checkbox" />
              <span class="muted">Sim</span>
            </div>
          </div>
        </div>

        <div class="grid" style="grid-template-columns: 1fr; gap:12px; margin-top:12px;">
          <div>
            <label class="muted">Descrição</label>
            <input id="tx-description" type="text" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #dbe1e7;border-radius:10px;" />
          </div>
        </div>

        <div style="margin-top:12px;">
          <button id="tx-save-btn">Salvar movimentação</button>
        </div>
      </div>

      <div class="card" style="margin-top:16px;">
        <h3>Tabela de movimentações em conta</h3>
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

      <div class="card" style="margin-top:16px;">
        <h3>Compras no cartão de crédito do mês</h3>
        <div class="muted" style="margin-bottom:12px;">Total do mês: ${brl(creditData.total)}</div>
        <table class="table">
          <thead>
            <tr>
              <th>Compra</th>
              <th>Cartão</th>
              <th>Categoria</th>
              <th>Fatura</th>
              <th>Parcela</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${creditItems.map(item => `
              <tr>
                <td>${item.merchant || "-"}</td>
                <td>${item.card || "-"}</td>
                <td>${item.category || "-"}</td>
                <td>${item.statementMonth || "-"}</td>
                <td>${item.installment || "-"}</td>
                <td>${brl(item.amount)}</td>
                <td>${item.status || "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;

  const flowEl = document.getElementById("tx-flow");
  const categoryEl = document.getElementById("tx-category");
  const methodEl = document.getElementById("tx-method");
  const accountEl = document.getElementById("tx-account");
  const cardEl = document.getElementById("tx-card");

  const methodWrap = document.getElementById("tx-method-wrap");
  const accountWrap = document.getElementById("tx-account-wrap");
  const cardWrap = document.getElementById("tx-card-wrap");
  const installmentsWrap = document.getElementById("tx-installments-wrap");
  const partialWrap = document.getElementById("tx-card-bill-partial-wrap");
  const partialEl = document.getElementById("tx-card-bill-partial");

  function fillSelect(selectEl, items, valueKey, labelKey) {
    const previousValue = selectEl.value;

    selectEl.innerHTML = items.map(item => `
      <option value="${item[valueKey]}">${item[labelKey]}</option>
    `).join("");

    const hasPrevious = items.some(item => String(item[valueKey]) === String(previousValue));

    if (hasPrevious) {
      selectEl.value = previousValue;
    } else if (items.length) {
      selectEl.value = String(items[0][valueKey]);
    } else {
      selectEl.value = "";
    }
  }

  function refreshCategories() {
    const flow = flowEl.value;
    const filtered = categories.filter(c => String(c.flow).toUpperCase() === flow);
    fillSelect(categoryEl, filtered, "category_id", "name");
  }

  function refreshMethods() {
    fillSelect(methodEl, methods, "payment_method_id", "name");
  }

  function refreshAccounts(flow) {
    let filtered = accounts;

    if (flow === "RECEITA") {
      filtered = accounts.filter(a => a.kind === "CONTA" || a.kind === "BENEFICIO");
    } else {
      filtered = accounts.filter(a => a.kind === "CONTA");
    }

    fillSelect(accountEl, filtered, "account_id", "name");
  }

  function refreshCards() {
    fillSelect(cardEl, cards, "card_id", "name");
  }

  function updateDynamicFields() {
    const flow = flowEl.value;

    refreshCategories();
    refreshAccounts(flow);
    refreshCards();

    const categoryId = categoryEl.value;
    const method = methodEl.value;
    const isCardBill = flow === "DESPESA" && categoryId === "cat_card_bill";

    partialWrap.style.display = "none";

    if (flow === "RECEITA") {
      methodWrap.style.display = "none";
      cardWrap.style.display = "none";
      installmentsWrap.style.display = "none";
      accountWrap.style.display = "block";
      partialEl.checked = false;
      return;
    }

    if (isCardBill) {
      methodWrap.style.display = "none";
      cardWrap.style.display = "block";
      installmentsWrap.style.display = "none";
      accountWrap.style.display = "block";
      partialWrap.style.display = "block";
      return;
    }

    methodWrap.style.display = "block";
    partialEl.checked = false;

    if (method === "pm_cc") {
      cardWrap.style.display = "block";
      installmentsWrap.style.display = "block";
      accountWrap.style.display = "none";
      return;
    }

    if (method === "pm_cd") {
      cardWrap.style.display = "block";
      installmentsWrap.style.display = "none";
      accountWrap.style.display = "none";
      return;
    }

    if (method === "pm_cash") {
      cardWrap.style.display = "none";
      installmentsWrap.style.display = "none";
      accountWrap.style.display = "none";
      return;
    }

    cardWrap.style.display = "none";
    installmentsWrap.style.display = "none";
    accountWrap.style.display = "block";
  }

  refreshMethods();
  updateDynamicFields();

  flowEl.addEventListener("change", updateDynamicFields);
  methodEl.addEventListener("change", updateDynamicFields);
  categoryEl.addEventListener("change", updateDynamicFields);

  document.getElementById("mov-filter-btn").addEventListener("click", async () => {
    const newMonth = document.getElementById("mov-month").value || getCurrentMonth();
    await renderMovimentacoesByMonth(root, token, newMonth);
  });

  document.getElementById("tx-save-btn").addEventListener("click", async () => {
    const flow = flowEl.value;
    const method = methodEl.value;

    const categoryId = document.getElementById("tx-category").value;
    const isCardBill = flow === "DESPESA" && categoryId === "cat_card_bill";

    const payload = {
      date: document.getElementById("tx-date").value,
      flow: flow,
      amount: Number(document.getElementById("tx-amount").value || 0),
      category_id: categoryId,
      payment_method_id: flow === "RECEITA" ? "" : (isCardBill ? "" : method),
      account_id: accountWrap.style.display === "none" ? "" : document.getElementById("tx-account").value,
      card_id: cardWrap.style.display === "none" ? "" : document.getElementById("tx-card").value,
      installments_total: installmentsWrap.style.display === "none"
        ? 1
        : Number(document.getElementById("tx-installments").value || 1),
      description: document.getElementById("tx-description").value,
      status: "PAID",
      is_partial: isCardBill ? Boolean(partialEl.checked) : false
    };

    if (flow === "RECEITA") {
      const selectedAccount = accounts.find(a => a.account_id === payload.account_id);
      payload.wallet = selectedAccount?.kind || "CONTA";
    } else {
      payload.wallet = "CONTA";
    }

    const res = await api.addMovimentacao(token, payload);
    if (!res.ok) {
      window.showToast(res.message || "Erro ao salvar movimentação.", "error");
      return;
    }

    if (res.mode === "credit_card") {
      window.showToast("Compra no cartão de crédito registrada na fatura com sucesso.", "success");
    } else if (res.mode === "card_bill_payment") {
      const settled = Number(res.settled_amount || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      });

      if (Number(res.remaining_unapplied || 0) > 0) {
        const rest = Number(res.remaining_unapplied || 0).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL"
        });
        window.showToast(`Pagamento registrado. ${settled} abatido da fatura. Sobra não aplicada: ${rest}.`, "success");
      } else {
        window.showToast(`Pagamento registrado. ${settled} abatido da fatura e limite liberado.`, "success");
      }
    } else {
      window.showToast("Movimentação salva com sucesso.", "success");
    }

    await renderMovimentacoesByMonth(
      root,
      token,
      document.getElementById("mov-month").value || getCurrentMonth()
    );
  });

  root.querySelectorAll(".tx-delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const txId = btn.dataset.id;
      const ok = confirm("Deseja excluir esta movimentação?");
      if (!ok) return;

      const res = await api.deleteMovimentacao(token, txId);
      if (!res.ok) {
        window.showToast(res.message || "Erro ao excluir.", "error");
        return;
      }

      window.showToast("Movimentação excluída com sucesso.", "success");
      await renderMovimentacoesByMonth(root, token, document.getElementById("mov-month").value || getCurrentMonth());
    });
  });

  root.querySelectorAll(".tx-status-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const txId = btn.dataset.id;
      const nextStatus = btn.dataset.next;

      const res = await api.updateMovimentacaoStatus(token, txId, nextStatus);
      if (!res.ok) {
        window.showToast(res.message || "Erro ao atualizar status.", "error");
        return;
      }

      window.showToast("Status atualizado com sucesso.", "success");
      await renderMovimentacoesByMonth(root, token, document.getElementById("mov-month").value || getCurrentMonth());
    });
  });
}