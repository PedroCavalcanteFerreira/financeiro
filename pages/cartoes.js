import { api } from "../api.js";

function brl(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

export async function renderCartoes(root) {
  const token = localStorage.getItem("finance_token");
  if (!token) {
    throw new Error("Token não encontrado.");
  }

  const res = await api.getCartoesData(token);
  console.log("Resposta cartoes:", res);

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
            <div class="card">
              <div class="kpi-label">${card.name}</div>
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
                <td>${line.cardId || "-"}</td>
                <td>${line.merchant || "-"}</td>
                <td>${line.purchaseDate || "-"}</td>
                <td>${line.statementMonth || "-"}</td>
                <td>${line.installmentLabel || "-"}</td>
                <td>${brl(line.amount)}</td>
                <td>${line.status || "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}