// search.js (Knowora V1.4) — loader + speak handling + fetch FR/EN wiki
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q") || '';
  const resultsEl = document.getElementById('results');
  const loader = document.getElementById('loader');
  const speakBtn = document.getElementById('speakBtn');

  function showLoader(show) {
    if (!loader) return;
    loader.style.display = show ? 'block' : 'none';
  }

  async function renderResults(query) {
    if (!resultsEl) return;
    resultsEl.innerHTML = `<p>🔎 Recherche : ${escapeHtml(query)}</p>`;
    showLoader(true);
    const frUrl = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const enUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;

    let html = `<h2>Résultats pour "${escapeHtml(query)}"</h2>`;
    let found = false;

    // essayer FR d'abord
    try {
      const r = await fetch(frUrl);
      if (r.ok) {
        const data = await r.json();
        if (data && data.extract) {
          html += `<div><h3>🇫🇷 Wikipedia (FR)</h3><p>${escapeHtml(data.extract)}</p></div>`;
          found = true;
        }
      }
    } catch (e) {
      console.warn('fr wiki failed', e);
    }

    // puis EN
    try {
      const r2 = await fetch(enUrl);
      if (r2.ok) {
        const data2 = await r2.json();
        if (data2 && data2.extract) {
          html += `<div><h3>🇬🇧 Wikipedia (EN)</h3><p>${escapeHtml(data2.extract)}</p></div>`;
          found = true;
        }
      }
    } catch (e) {
      console.warn('en wiki failed', e);
    }

    if (!found) html += `<p>Aucun résultat trouvé.</p>`;
    resultsEl.innerHTML = html;
    showLoader(false);
  }

  if (query) {
    renderResults(query);
  } else {
    if (resultsEl) resultsEl.innerHTML = '<p>Entrez une recherche depuis la page d’accueil.</p>';
  }

  // speak button
  if (speakBtn) {
    speakBtn.addEventListener('click', () => {
      const text = resultsEl ? resultsEl.innerText : '';
      if (!text) return;
      const utter = new SpeechSynthesisUtterance(text);
      // si la page contient plus d'anglais que de français, on pourrait basculer,
      // ici simple heuristique : si query contient accented letters => fr
      const hasAccents = /[àâäéèêëîïôöûüùçœ]/i.test(query);
      utter.lang = hasAccents ? 'fr-FR' : 'en-US';
      window.speechSynthesis.cancel(); // stop previous
      window.speechSynthesis.speak(utter);
    });
  }

  // helper
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
});
