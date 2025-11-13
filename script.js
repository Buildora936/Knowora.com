// Knowora v1.2 - Google + ChatGPT style (FR/EN)
// Recherche Wikipedia (auto FR/EN), chat IA simulé, historique localStorage, thème

document.addEventListener('DOMContentLoaded', () => {
  const qInput = document.getElementById('query');
  const searchBtn = document.getElementById('searchBtn');
  const aiBtn = document.getElementById('aiBtn');
  const resultsEl = document.getElementById('results');
  const historyList = document.getElementById('historyList');
  const clearHistory = document.getElementById('clearHistory');
  const langSelect = document.getElementById('langSelect');
  const themeToggle = document.getElementById('themeToggle');
  const yr = document.getElementById('yr');
  yr && (yr.textContent = new Date().getFullYear());

  // Chat elements
  const chatWindow = document.getElementById('chatWindow');
  const chatInput = document.getElementById('chatInput');
  const sendChat = document.getElementById('sendChat');

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
  const HIST_KEY = 'knowora_history_v1.2';
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
        qInput.value = entry.q;
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

  function saveHistory(q, lang) {
    if (!q) return;
    const arr = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
    arr.push({ q, lang, t: Date.now() });
    if (arr.length > 100) arr.splice(0, arr.length - 100);
    localStorage.setItem(HIST_KEY, JSON.stringify(arr));
    loadHistory();
  }

  // language detection helper: auto => based on browser or simple char test
  function detectLangAuto(q) {
    const browser = navigator.language || navigator.userLanguage || 'fr';
    // quick heuristic: presence of accented chars -> french
    if (/[àâçéèêëîïôûùüœ]/i.test(q)) return 'fr';
    if (/\b(le|la|les|de|des|un|une|et)\b/i.test(q)) return 'fr';
    if (/^[\u0000-\u007F]*$/.test(q) && browser.startsWith('en')) return 'en';
    // fallback to fr
    return browser.startsWith('en') ? 'en' : 'fr';
  }

  // wiki fetch
  async function fetchWikiSummary(query, lang) {
    const endpoint = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const r = await fetch(endpoint);
    if (!r.ok) throw new Error('Aucun résultat ou erreur réseau');
    return r.json();
  }

  function renderResult(title, extract, url, thumb) {
    resultsEl.innerHTML = `
      <div class="result-card">
        ${thumb ? `<img class="thumbnail" src="${thumb}" alt="${title}">` : ''}
        <div class="meta">
          <h2>${title}</h2>
          <p>${extract}</p>
          <p><a target="_blank" href="${url}">Lire plus sur Wikipedia →</a></p>
        </div>
      </div>
    `;
  }

  async function doSearch(q, forcedLang) {
    resultsEl.innerHTML = `<div class="result-card"><p>🔎 Recherche « ${q} »…</p></div>`;
    let lang = forcedLang || langSelect.value || 'auto';
    if (lang === 'auto') lang = detectLangAuto(q);
    try {
      const data = await fetchWikiSummary(q, lang);
      if (data?.title && data?.extract) {
        const thumb = data?.thumbnail?.source || '';
        const link = data?.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(data.title)}`;
        renderResult(data.title, data.extract, link, thumb);
        saveHistory(q, lang);
      } else {
        resultsEl.innerHTML = `<div class="result-card"><p>Aucun résumé trouvé pour « ${q} ».</p></div>`;
      }
    } catch (err) {
      resultsEl.innerHTML = `<div class="result-card"><p>Erreur : ${err.message}</p></div>`;
    }
  }

  // mini-AI: conversation + uses wiki summary internally; ready to be replaced by real API
  function appendChat(message, who='assistant') {
    const div = document.createElement('div');
    div.className = `chat-msg ${who === 'user' ? 'user' : 'assistant'}`;
    div.innerHTML = `<div class="bubble">${escapeHtml(message)}</div>`;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function escapeHtml(text){ return String(text).replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }

  async function aiAnswer(q, forcedLang) {
    appendChat(q, 'user');
    appendChat('🤖 Knowora réfléchit…', 'assistant');
    let lang = forcedLang || langSelect.value || 'auto';
    if (lang === 'auto') lang = detectLangAuto(q);
    try {
      const data = await fetchWikiSummary(q, lang);
      if (!data?.extract) {
        // replace last assistant message
        chatWindow.lastChild.querySelector('.bubble').innerText = `Désolé, aucune source trouvée pour "${q}".`;
        return;
      }
      // simple reformulation: take first 3 sentences
      const text = data.extract;
      const sentences = text.match(/[^.!?]+[.!?]?/g) || [text];
      const short = sentences.slice(0, 3).join(' ').trim();
      const reply = (lang === 'fr')
        ? `Résumé Knowora : ${short}\n\nPour plus de détails, cliquez "Lire plus" ou demande une précision.`
        : `Knowora summary: ${short}\n\nFor more details click "Read more" or ask a more specific question.`;

      // replace last assistant placeholder with real reply
      chatWindow.lastChild.querySelector('.bubble').innerText = reply;
      saveHistory(q, lang);
    } catch (err) {
      chatWindow.lastChild.querySelector('.bubble').innerText = `Erreur AI : ${err.message}`;
    }
  }

  // UI events
  searchBtn.addEventListener('click', () => {
    const q = qInputTrim();
    if (!q) return resultsEl.innerHTML = `<div class="result-card"><p>Entrez un mot-clé.</p></div>`;
    const lang = langSelect.value === 'auto' ? 'auto' : langSelect.value;
    doSearch(q, lang);
  });

  aiBtn.addEventListener('click', () => {
    const q = qInputTrim();
    if (!q) return appendChat('Pose une question pour Knowora AI.', 'assistant');
    aiAnswer(q);
  });

  // suggestions
  document.querySelectorAll('.sugg').forEach(b => b.onclick = () => { qInputSet(b.innerText); });

  function qInputTrim(){ return (qInput.value || '').trim(); }
  function qInputSet(v){ qInput.value = v; searchBtn.click(); }

  // enter key in search
  const qInput = document.getElementById('query');
  qInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchBtn.click(); });

  // chat send
  sendChat.addEventListener('click', () => {
    const t = (chatInput.value || '').trim();
    if (!t) return;
    chatInput.value = '';
    aiAnswer(t);
  });
  chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat.click(); });

  // init sample content
  resultsEl.innerHTML = `<div class="empty">Bienvenue sur Knowora v1.2 — tapez votre recherche puis appuyez sur Rechercher ou Ask Knowora AI.</div>`;
});
