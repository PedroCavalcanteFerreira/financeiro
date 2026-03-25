const API_URL = "https://script.google.com/macros/s/AKfycbzPjETT9cb_jsmO0lbR49ExxkAdnGefV8ut9QLipGw9sRtjTUbwhhs-v6f6-0qd7N-YXg/exec";

async function getJSON(url) {
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store"
  });

  return res.json();
}

async function postJSON(body) {
  const formBody = new URLSearchParams();
  formBody.append("payload", JSON.stringify(body));

  const res = await fetch(API_URL, {
    method: "POST",
    body: formBody,
    cache: "no-store"
  });

  return res.json();
}

export const api = {
  async login(username, password) {
    return postJSON({
      action: "login",
      username,
      password
    });
  },

  async getDataVersion(token) {
    const url = `${API_URL}?action=dataVersion&token=${encodeURIComponent(token)}&_ts=${Date.now()}`;
    return getJSON(url);
  },

  async getResumoData(token) {
    const url = `${API_URL}?action=resumo&token=${encodeURIComponent(token)}&_ts=${Date.now()}`;
    return getJSON(url);
  },

  async getCartoesData(token) {
    const url = `${API_URL}?action=cartoes&token=${encodeURIComponent(token)}&_ts=${Date.now()}`;
    return getJSON(url);
  },

  async getContasAPagar(token) {
    const url = `${API_URL}?action=contasAPagar&token=${encodeURIComponent(token)}&_ts=${Date.now()}`;
    return getJSON(url);
  },

  async getAssinaturas(token) {
    const url = `${API_URL}?action=assinaturas&token=${encodeURIComponent(token)}&_ts=${Date.now()}`;
    return getJSON(url);
  },

  async getMovimentacoes(token, month) {
    const url = `${API_URL}?action=movimentacoes&token=${encodeURIComponent(token)}&month=${encodeURIComponent(month)}&_ts=${Date.now()}`;
    return getJSON(url);
  },

  async getConfigMovimentacoes(token) {
    const url = `${API_URL}?action=configMovimentacoes&token=${encodeURIComponent(token)}&_ts=${Date.now()}`;
    return getJSON(url);
  },

  async getComprasCredito(token, month) {
    const url = `${API_URL}?action=comprasCredito&token=${encodeURIComponent(token)}&month=${encodeURIComponent(month)}&_ts=${Date.now()}`;
    return getJSON(url);
  },

  async addMovimentacao(token, payload) {
    return postJSON({
      action: "addMovimentacao",
      token,
      payload
    });
  },

  async deleteMovimentacao(token, txId) {
    return postJSON({
      action: "deleteMovimentacao",
      token,
      txId
    });
  },

  async updateMovimentacaoStatus(token, txId, status) {
    return postJSON({
      action: "updateMovimentacaoStatus",
      token,
      txId,
      status
    });
  },

  async getConfigAssinaturas(token) {
    const url = `${API_URL}?action=configAssinaturas&token=${encodeURIComponent(token)}&_ts=${Date.now()}`;
    return getJSON(url);
  },

  async addAssinatura(token, payload) {
    return postJSON({
      action: "addAssinatura",
      token,
      payload
    });
  },

  async toggleAssinaturaStatus(token, subscriptionId) {
    return postJSON({
      action: "toggleAssinaturaStatus",
      token,
      subscriptionId
    });
  },

  async deleteAssinatura(token, subscriptionId) {
    return postJSON({
      action: "deleteAssinatura",
      token,
      subscriptionId
    });
  }
};