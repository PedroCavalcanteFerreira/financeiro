const API_URL = "https://script.google.com/macros/s/AKfycbzmf0LFOkh7tvw1TmkrBE4KJWft4gOvn3q3vrOmzL-4xGxqqy2WWtaqKCotyi6HUjBr/exec";

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

  async getResumoData(token) {
    const url = `${API_URL}?action=resumo&token=${encodeURIComponent(token)}&_ts=${Date.now()}`;
    return getJSON(url);
  },

  async getCartoesData(token) {
  const url = `${API_URL}?action=cartoes&token=${encodeURIComponent(token)}&_ts=${Date.now()}`;
  return getJSON(url);
}
};