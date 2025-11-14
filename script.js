// script.js (Knowora V1.4 — corrigé)
// Gère : thème, suggestions, micro (animation), historique, recherche
document.addEventListener('DOMContentLoaded', () => {
  // éléments
  const slogan = document.getElementById('slogan');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const suggestionsBox = document.getElementById('suggestions');
  const historyListEl = document.getElementById('historyList');
  const themeToggle = document.getElementById('themeToggle');
  const micBtn = document.getElementById('micBtn');

  // détection langue / placeholder
  const userLang = navigator.language || navigator.userLanguage || 'fr';
  if (userLang.startsWith('en')) {
    if (slogan) slogan.textContent = "Knowledge at your fingertips";
    if (searchInput) searchInput.placeholder = "Search...";
  }

  /* ===== THEME ===== */
  // lecture du thème sauvé
  const savedTheme = localStorage.getItem('knowora_theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    if (themeToggle) themeToggle.textContent = '☀️';
  } else {
    if (themeToggle) themeToggle.textContent = '🌙 Mode sombre';
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const isDark = document.body.classList.contains('dark');
      themeToggle.textContent = isDark ? '☀️' : '🌙 Mode sombre';
      localStorage.setItem('knowora_theme', isDark ? 'dark' : 'light');
    });
  }

  /* ===== HISTORIQUE ===== */
  const HIST_KEY = 'knowora_history_v1';
  function loadHistory() {
    const hist = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
    if (!historyListEl) return;
    historyListEl.innerHTML = '';
    if (hist.length === 0) {
      historyListEl.innerHTML = '<li style="color:var(--muted || #666)">Aucun historique.</li>';
      return;
    }
    hist.slice().reverse().slice(0, 10).forEach(q => {
      const li = document.createElement('li');
      li.textContent = q;
      li.style.cursor = 'pointer';
      li.onclick = () => {
        window.location.href = `search.html?q=${encodeURIComponent(q)}`;
      };
      historyListEl.appendChild(li);
    });
  }
  loadHistory();
  function saveHistory(q) {
    if (!q) return;
    const arr = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
    if (!arr.includes(q)) arr.push(q);
    // garder max 200
    while (arr.length > 200) arr.shift();
    localStorage.setItem(HIST_KEY, JSON.stringify(arr));
    loadHistory();
  }

  /* ===== RECHERCHE (bouton) ===== */
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
      const q = searchInput.value.trim();
      if (!q) return;
      saveHistory(q);
      window.location.href = `search.html?q=${encodeURIComponent(q)}`;
    });
  }

  /* ===== SUGGESTIONS (DuckDuckGo) ===== */
  if (searchInput && suggestionsBox) {
    let suggestionsTimeout = null;
    searchInput.addEventListener('input', async (e) => {
      const q = e.target.value.trim();
      if (!q) {
        suggestionsBox.style.display = 'none';
        return;
      }
      // throttle
      if (suggestionsTimeout) clearTimeout(suggestionsTimeout);
      suggestionsTimeout = setTimeout(async () => {
        try {
          const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1`);
          const data = await res.json();
          suggestionsBox.innerHTML = '';
          const related = data.RelatedTopics || [];
          let count = 0;
          for (const item of related) {
            // item may be group with Topics
            let text = item.Text || (item.Topics && item.Topics[0] && item.Topics[0].Text);
            if (!text) continue;
            const li = document.createElement('li');
            li.textContent = text;
            li.onclick = () => {
              searchInput.value = text;
              suggestionsBox.style.display = 'none';
            };
            suggestionsBox.appendChild(li);
            count++;
            if (count >= 6) break;
          }
          suggestionsBox.style.display = suggestionsBox.children.length ? 'block' : 'none';
        } catch (err) {
          suggestionsBox.style.display = 'none';
          console.warn('DuckDuckGo suggestions failed', err);
        }
      }, 220);
    });
    // fermer suggestions si clic en dehors
    document.addEventListener('click', (ev) => {
      if (!suggestionsBox.contains(ev.target) && ev.target !== searchInput) suggestionsBox.style.display = 'none';
    });
  }

  /* ===== MICRO (SpeechRecognition) ===== */
  if (micBtn) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (!Recognition) {
      // navigateur non supporté
      micBtn.style.display = 'none';
    } else {
      const rec = new Recognition();
      // choix de langue: basique : si navigateur anglais, en-US sinon fr-FR
      rec.lang = userLang.startsWith('en') ? 'en-US' : 'fr-FR';
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      micBtn.addEventListener('click', () => {
        try {
          rec.start();
          micBtn.classList.add('listening');
        } catch (e) {
          console.warn('start rec failed', e);
        }
      });

      rec.onresult = (ev) => {
        const t = ev.results[0][0].transcript;
        if (searchInput) searchInput.value = t;
        micBtn.classList.remove('listening');
      };
      rec.onerror = (e) => {
        console.warn('Speech error', e);
        micBtn.classList.remove('listening');
      };
      rec.onend = () => micBtn.classList.remove('listening');
    }
  }

}); // DOMContentLoaded
