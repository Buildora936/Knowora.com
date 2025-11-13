// Knowora v1.0 - script.js
// Bilingue FR/EN, recherche Wikipedia + mini IA simulée, historique localStorage, thème

document.addEventListener('DOMContentLoaded', () => {
  const queryIn = document.getElementById('query');
  const searchBtn = document.getElementById('searchBtn');
  const aiBtn = document.getElementById('aiBtn');
  const results = document.getElementById('results');
  const historyList = document.getElementById('historyList');
  const clearHistory = document.getElementById('clearHistory');
  const langSelect = document.getElementById('langSelect');
  const themeToggle = document.getElementById('themeToggle');
  const yr = document.getElementById('yr');
  yr.textContent = new Date().getFullYear();

  // init theme
  const savedTheme = localStorage.getItem('knowora_theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.checked = true;
  }

  themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('knowora_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('knowora_theme', 'light');
    }
  });

  // history
  const HIST_KEY = 'knowora_history_v1';
  function loadHistory() {
    const h = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
    historyList.innerHTML = '';
    if (h.length === 0) {
      historyList.innerHTML = '<div style="color:var(--muted)">Aucune recherche récente.</div>';
      return;
    }
    h.slice().reverse().forEach((entry, idx) => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `<div>${entry.q} <small style="color:var(--muted)">· ${entry.lang.toUpperCase()}</small></div>
        <div><button data-i="${idx}">Voir</button></div>`;
      historyList.appendChild(div);
      div.querySelector('button').onclick = () => {
        queryIn.value = entry.q;
        langSelect.value = entry.lang;
        doSearch(entry.q, entry.lang);
      };
    });
  }
  loadHistory();
  clearHistory.addEventListener('click', () => {
    localStorage.removeItem(HIST_KEY);
    loadHistory();
  });

  // helpers
  function saveHistory(q, lang) {
    if (!q) return;
    const arr = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
    arr.push({ q, lang, t: Date.now() });
    // keep max 50
    if (arr.length > 50) arr.splice(0, arr.length - 50);
    localStorage.setItem(HIST_KEY, JSON.stringify(arr));
    loadHistory();
  }

  // main search function: Wikipedia summary
  async function fetchWikiSummary(query, lang = 'fr') {
    const endpoint = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const r = await fetch(endpoint);
    if (!r.ok) {
      throw new Error('Aucun résultat ou erreur réseau');
    }
    return r.json();
  }

  function showResultCard(title, extract, url, thumbnail) {
    results.innerHTML = `
      <div class="result-card">
        ${thumbnail ? `<img class="thumbnail" src="${thumbnail}" alt="${title}">` : ''}
        <h2>${title}</h2>
        <p>${extract}</p>
        <p><a target="_blank" href="${url}">Lire plus sur Wikipedia →</a></p>
      </div>
    `;
  }

  async function doSearch(q, lang) {
    results.innerHTML = `<div class="result-card"><p>🔎 Recherche « ${q} » (${lang.toUpperCase()})…</p></div>`;
    try {
      const data = await fetchWikiSummary(q, lang);
      if (data?.title && data?.extract) {
        const thumb = data?.thumbnail?.source || '';
        const link = data?.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(data.title)}`;
        showResultCard(data.title, data.extract, link, thumb);
        saveHistory(q, lang);
      } else {
        results.innerHTML = `<div class="result-card"><p>Aucun résumé trouvé pour « ${q} ».</p></div>`;
      }
    } catch (err) {
      results.innerHTML = `<div class="result-card"><p>Erreur : ${err.message}</p></div>`;
    }
  }

  // mini AI: simuler une réponse plus naturelle en reformulant le résumé
  async function aiAnswer(q, lang) {
    results.innerHTML = `<div class="result-card"><p>🤖 Knowora pense…</p></div>`;
    try {
      const data = await fetchWikiSummary(q, lang);
      let text = data?.extract || null;
      if (!text) {
        results.innerHTML = `<div class="result-card"><p>Désolé, aucune source trouvée pour "${q}".</p></div>`;
        return;
      }

      // simple "reformulation" heuristic: keep first 3 sentences and add friendly tone
      const sentences = text.match(/[^.!?]+[.!?]?/g) || [text];
      const short = sentences.slice(0, 3).join(' ').trim();

      // language aware template
      const reply = (lang === 'fr')
        ? `Voici un résumé (Knowora AI) : ${short}\n\nSi tu veux plus de détails, clique sur "Lire plus" ou pose une question plus précise.`
        : `Here is a quick summary (Knowora AI): ${short}\n\nIf you want more details, click "Read more" or ask a more specific question.`;

      const thumb = data?.thumbnail?.source || '';
      const link = data?.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(data.title)}`;

      results.innerHTML = `
        <div class="result-card">
          ${thumb ? `<img class="thumbnail" src="${thumb}" alt="${data.title}">` : ''}
          <h2>${data.title} — Knowora AI</h2>
          <p style="white-space:pre-line">${reply}</p>
          <p><a target="_blank" href="${link}">${lang === 'fr' ? 'Lire plus sur Wikipedia' : 'Read more on Wikipedia'} →</a></p>
        </div>
      `;
      saveHistory(q, lang);
    } catch (err) {
      results.innerHTML = `<div class="result-card"><p>Erreur AI : ${err.message}</p></div>`;
    }
  }

  // UI events
  searchBtn.addEventListener('click', () => {
    const q = queryIn.value.trim();
    if (!q) { results.innerHTML = `<div class="result-card"><p>Entrez un mot-clé.</p></div>`; return; }
    const lang = langSelect.value || 'fr';
    doSearch(q, lang);
  });

  aiBtn.addEventListener('click', () => {
    const q = queryIn.value.trim();
    if (!q) { results.innerHTML = `<div class="result-card"><p>Pose une question pour Knowora AI.</p></div>`; return; }
    const lang = langSelect.value || 'fr';
    aiAnswer(q, lang);
  });

  // enter key
  queryIn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchBtn.click();
  });

});
