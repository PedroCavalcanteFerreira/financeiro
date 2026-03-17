import { api } from "../api.js";
import { renderBarChart, renderDoughnutChart } from "../charts.js";

function brl(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

export async function renderResumo(root) {
  const token = localStorage.getItem("finance_token");
  const res = await api.getResumoData(token);

  if (!res.ok) {
    root.innerHTML = `
      <div class="card">
        <h3>Resumo</h3>
        <p class="muted">Erro ao carregar dados: ${res.message || "erro desconhecido"}</p>
      </div>
    `;
    return;
  }

  const data = res.data;

  root.innerHTML = `
    <section>
      <div class="grid grid-kpi">
        <div class="card">
          <div class="kpi-label">Sobrou do mês anterior</div>
          <div class="kpi-value">${brl(data.kpis.carryover)}</div>
        </div>

        <div class="card">
          <div class="kpi-label">Saldo atual - Conta</div>
          <div class="kpi-value">${brl(data.kpis.saldoConta)}</div>
        </div>

        <div class="card">
          <div class="kpi-label">Saldo atual - Benefícios</div>
          <div class="kpi-value">${brl(data.kpis.saldoBeneficios)}</div>
        </div>

        <div class="card">
          <div class="kpi-label">Total disponível</div>
          <div class="kpi-value">${brl(data.kpis.saldoTotal)}</div>
        </div>
      </div>

      <div class="grid grid-kpi" style="margin-top:16px;">
        <div class="card">
          <div class="kpi-label">Resultado do mês - Conta</div>
          <div class="kpi-value">${brl(data.kpis.resultadoConta)}</div>
        </div>

        <div class="card">
          <div class="kpi-label">Resultado do mês - Benefícios</div>
          <div class="kpi-value">${brl(data.kpis.resultadoBeneficios)}</div>
        </div>

        <div class="card">
          <div class="kpi-label">A pagar (30 dias)</div>
          <div class="kpi-value">${brl(data.kpis.aPagar30d)}</div>
        </div>

        <div class="card">
          <div class="kpi-label">Observação</div>
          <div class="muted">Resumo geral do mês, separado entre caixa e crédito.</div>
        </div>
      </div>

      <div class="grid grid-charts">
        <div class="card">
          <h3>Receitas x Despesas (Conta)</h3>
          <canvas id="chart-conta"></canvas>
        </div>

        <div class="card">
          <h3>Receitas x Despesas (Benefícios)</h3>
          <canvas id="chart-beneficios"></canvas>
        </div>

        <div class="card">
          <h3>Contas a pagar</h3>
          <canvas id="chart-a-pagar"></canvas>
        </div>
      </div>

      <div class="grid grid-bottom">
        <div class="card">
          <h3>Cartões</h3>
          <div id="cards-summary" class="simple-list"></div>
        </div>

        <div class="card">
          <h3>Últimas movimentações</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Wallet</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody id="last-movs-body"></tbody>
          </table>
        </div>
      </div>
    </section>
  `;

  renderBarChart("chart-conta", data.receitaDespesaConta.labels, [
    { label: "Receitas", data: data.receitaDespesaConta.receitas },
    { label: "Despesas", data: data.receitaDespesaConta.despesas }
  ]);

  renderBarChart("chart-beneficios", data.receitaDespesaBeneficios.labels, [
    { label: "Receitas", data: data.receitaDespesaBeneficios.receitas },
    { label: "Despesas", data: data.receitaDespesaBeneficios.despesas }
  ]);

  renderDoughnutChart(
    "chart-a-pagar",
    data.contasAPagarBreakdown.labels,
    data.contasAPagarBreakdown.values
  );

  const cardsSummary = document.getElementById("cards-summary");
  cardsSummary.innerHTML = data.cartoes.map((card) => {
    const disponivel = Number(card.limiteTotal) - Number(card.limiteUsado);
    const percentual = card.limiteTotal > 0
      ? Math.min((Number(card.limiteUsado) / Number(card.limiteTotal)) * 100, 100)
      : 0;

    return `
      <div class="simple-item">
        <div style="flex:1;">
          <div><strong>${card.name}</strong></div>
          <div class="muted">Fatura aberta: ${brl(card.faturaAberta)}</div>
          <div class="muted">Vencimento: ${card.vencimento}</div>

          <div class="progress-wrap">
            <div class="muted">Usado: ${brl(card.limiteUsado)} | Disponível: ${brl(disponivel)}</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${percentual}%"></div>
            </div>
          </div>
        </div>
        <div>
          <strong>${percentual.toFixed(1)}%</strong>
        </div>
      </div>
    `;
  }).join("");

  const body = document.getElementById("last-movs-body");
  body.innerHTML = data.ultimasMovimentacoes.map((item) => `
    <tr>
      <td>${item.data}</td>
      <td>${item.descricao}</td>
      <td>${item.wallet}</td>
      <td>${brl(item.valor)}</td>
    </tr>
  `).join("");
}