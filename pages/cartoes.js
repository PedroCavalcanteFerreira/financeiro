import { api } from "../api.js";

function brl(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getCardTheme(card) {
  const name = String(card.name || "").toLowerCase();

  if (name.includes("black")) {
    return {
      background: "linear-gradient(180deg, #0b0b0d 0%, #16181d 100%)",
      color: "#ffffff",
      chip: "#2e3340",
      accent: "#9ca3af"
    };
  }

  if (name.includes("platinum")) {
    return {
      background: "linear-gradient(180deg, #dfe3e8 0%, #b8c0cc 100%)",
      color: "#1f2937",
      chip: "#8f99a8",
      accent: "#6b7280"
    };
  }

  if (name.includes("gold")) {
    return {
      background: "linear-gradient(180deg, #6a4a12 0%, #c7921c 55%, #f0cf70 100%)",
      color: "#ffffff",
      chip: "#e3b94c",
      accent: "#fef3c7"
    };
  }

  return {
    background: "linear-gradient(180deg, #1d4ed8 0%, #2563eb 45%, #60a5fa 100%)",
    color: "#ffffff",
    chip: "#93c5fd",
    accent: "#dbeafe"
  };
}

function renderCardPreview(card) {
  const theme = getCardTheme(card);
  const safeName = escapeHtml(card.name || "Cartão");
  const last4 = escapeHtml(card.last4 || "8022");
  const brand = escapeHtml(card.brand || "Mastercard");

  if (card.imageUrl) {
    return `
      <div style="margin-top:10px;">
        <img
          src="${escapeHtml(card.imageUrl)}"
          alt="${safeName}"
          style="
            width:100%;
            max-width:340px;
            display:block;
            border-radius:18px;
            border:1px solid rgba(15,23,42,0.08);
            box-shadow:0 12px 30px rgba(15,23,42,0.14);
          "
        />
      </div>
    `;
  }

  return `
    <div style="margin-top:10px;">
      <div style="
        width:100%;
        max-width:340px;
        aspect-ratio: 1.58 / 1;
        border-radius:18px;
        background:${theme.background};
        color:${theme.color};
        position:relative;
        overflow:hidden;
        box-shadow:0 16px 34px rgba(15,23,42,0.18);
        border:1px solid rgba(255,255,255,0.08);
      ">
        <div style="
          position:absolute;
          inset:0;
          background:
            radial-gradient(circle at top right, rgba(255,255,255,0.12), transparent 30%),
            radial-gradient(circle at bottom left, rgba(255,255,255,0.08), transparent 28%);
        "></div>

        <div style="position:relative; z-index:1; padding:18px; height:100%; display:flex; flex-direction:column; justify-content:space-between;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div style="font-size:13px; opacity:.92;">${safeName}</div>
            <div style="font-size:15px; font-weight:700; letter-spacing:.3px;">PicPay</div>
          </div>

          <div style="
            width:42px;
            height:30px;
            border-radius:8px;
            background:${theme.chip};
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
          "></div>

          <div style="display:flex; justify-content:space-between; align-items:flex-end;">
            <div>
              <div style="font-size:22px; letter-spacing:2px; font-weight:700;">••${last4}</div>
              <div style="font-size:11px; opacity:.8; margin-top:6px;">Crédito</div>
            </div>

            <div style="display:flex; align-items:center; gap:6px;">
              <span style="
                width:28px;
                height:28px;
                border-radius:999px;
                background:rgba(255,255,255,0.28);
                display:inline-block;
              "></span>
              <span style="
                width:28px;
                height:28px;
                border-radius:999px;
                background:rgba(255,255,255,0.6);
                margin-left:-14px;
                display:inline-block;
              "></span>
              <span style="font-size:11px; opacity:.9; margin-left:2px;">${brand}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCardModalContent(card) {
  const percentual = card.limiteTotal > 0
    ? Math.min((card.limiteUsado / card.limiteTotal) * 100, 100)
    : 0;

  return `
    <div style="display:flex; flex-direction:column; gap:14px;">
      <div>
        <div class="kpi-label" style="font-size:14px;">${escapeHtml(card.name)}</div>
        ${renderCardPreview(card)}
      </div>

      <div>
        <div style="font-size:22px; font-weight:800; line-height:1;">${brl(card.faturaAberta)}</div>
        <div class="muted" style="margin-top:4px;">Fatura aberta</div>
      </div>

      <div class="muted">
        Fecha dia: ${card.closingDay || "-"} | Vence dia: ${card.dueDay || "-"}
      </div>
      <div class="muted">
        Vencimento atual: ${card.dueDate || "-"}
      </div>
      <div class="muted">
        Disponível: ${brl(card.limiteDisponivel)}
      </div>

      <div class="progress-wrap" style="margin-top:4px;">
        <div class="progress-bar">
          <div class="progress-fill" style="width:${percentual}%"></div>
        </div>
      </div>

      <div class="muted">
        Limite usado:
        <strong>${brl(card.limiteUsado)} / ${brl(card.limiteTotal)}</strong>
      </div>

      <div class="muted">
        ${percentual.toFixed(1)}% do limite comprometido
      </div>
    </div>
  `;
}

export async function renderCartoes(root) {
  const token = localStorage.getItem("finance_token");
  if (!token) {
    throw new Error("Token não encontrado.");
  }

  const res = await api.getCartoesData(token);

  if (!res.ok) {
    root.innerHTML = `
      <div class="card">
        <h3>Cartões</h3>
        <p class="muted">Erro ao carregar cartões: ${res.message || "erro desconhecido"}</p>
      </div>
    `;
    return;
  }

  const data = res.data || {};
  const cards = Array.isArray(data.cards) ? data.cards : [];
  const lines = Array.isArray(data.lines) ? data.lines : [];

  root.innerHTML = `
    <section>
      <div class="card">
        <h3>Cartões</h3>
        <p class="muted">Visão de limite, fatura aberta e parcelas.</p>
      </div>

      <div class="grid grid-kpi" style="margin-top:16px;">
        ${cards.map(card => {
          const percentual = card.limiteTotal > 0
            ? Math.min((card.limiteUsado / card.limiteTotal) * 100, 100)
            : 0;

          return `
            <div
              class="card card-card-item"
              data-card-id="${escapeHtml(card.cardId)}"
              style="cursor:pointer; transition:transform .16s ease, box-shadow .16s ease;"
            >
              <div class="kpi-label">${escapeHtml(card.name)}</div>
              <div class="kpi-value">${brl(card.faturaAberta)}</div>
              <div class="muted">Fatura aberta</div>

              <div style="margin-top:12px;" class="muted">
                Limite: ${brl(card.limiteTotal)}
              </div>
              <div class="muted">
                Usado: ${brl(card.limiteUsado)}
              </div>
              <div class="muted">
                Disponível: ${brl(card.limiteDisponivel)}
              </div>
              <div class="muted">
                Fecha dia: ${card.closingDay || "-"} | Vence dia: ${card.dueDay || "-"}
              </div>
              <div class="muted">
                Vencimento atual: ${card.dueDate || "-"}
              </div>

              <div class="progress-wrap">
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${percentual}%"></div>
                </div>
              </div>
              <div class="muted" style="margin-top:6px;">
                ${percentual.toFixed(1)}% do limite comprometido
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <div class="card" style="margin-top:16px;">
        <h3>Linhas / parcelas</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Cartão</th>
              <th>Loja</th>
              <th>Compra</th>
              <th>Fatura</th>
              <th>Parcela</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${lines.map(line => `
              <tr>
                <td>${escapeHtml(line.cardId || "-")}</td>
                <td>${escapeHtml(line.merchant || "-")}</td>
                <td>${escapeHtml(line.purchaseDate || "-")}</td>
                <td>${escapeHtml(line.statementMonth || "-")}</td>
                <td>${escapeHtml(line.installmentLabel || "-")}</td>
                <td>${brl(line.amount)}</td>
                <td>${escapeHtml(line.status || "-")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>

    <div
      id="card-detail-modal"
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
          max-width:460px;
          background:#fff;
          border-radius:18px;
          box-shadow:0 20px 50px rgba(0,0,0,0.18);
          overflow:hidden;
        "
      >
        <div style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:18px 18px 12px 18px;
          border-bottom:1px solid #eef2f7;
        ">
          <h3 style="margin:0; font-size:18px;">Detalhes do cartão</h3>
          <button
            id="card-detail-close"
            type="button"
            style="
              border:none;
              background:#f3f4f6;
              width:34px;
              height:34px;
              border-radius:999px;
              cursor:pointer;
              font-size:18px;
              line-height:1;
            "
          >
            ×
          </button>
        </div>

        <div id="card-detail-content" style="padding:18px;"></div>
      </div>
    </div>
  `;

  const modal = document.getElementById("card-detail-modal");
  const modalContent = document.getElementById("card-detail-content");
  const modalClose = document.getElementById("card-detail-close");

  function closeModal() {
    modal.style.display = "none";
    modalContent.innerHTML = "";
    document.removeEventListener("keydown", onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      closeModal();
    }
  }

  function openModal(card) {
    modalContent.innerHTML = renderCardModalContent(card);
    modal.style.display = "flex";
    document.addEventListener("keydown", onKeyDown);
  }

  modalClose.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  root.querySelectorAll(".card-card-item").forEach(el => {
    el.addEventListener("mouseenter", () => {
      el.style.transform = "translateY(-2px)";
      el.style.boxShadow = "0 10px 24px rgba(15,23,42,0.08)";
    });

    el.addEventListener("mouseleave", () => {
      el.style.transform = "translateY(0)";
      el.style.boxShadow = "";
    });

    el.addEventListener("click", () => {
      const cardId = el.dataset.cardId;
      const card = cards.find(c => String(c.cardId) === String(cardId));
      if (!card) return;
      openModal(card);
    });
  });
}