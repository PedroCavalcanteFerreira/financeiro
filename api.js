const API_URL = "https://script.google.com/macros/s/AKfycbzj-joRdWTTa_kxhymB5uKz75eQewmx5FtIkcAqHO7VkWfCqb_vOW2HAWOHbdCH_PF-6Q/exec";

async function getJSON(url) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });

  return res.json();
}

async function postJSON(body) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(body)
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

  async getResumoData(token) {
    const url = `${API_URL}?action=resumo&token=${encodeURIComponent(token)}`;
    return getJSON(url);
  }
};