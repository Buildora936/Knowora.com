// search.js — Knowora V1.5 (combines DuckDuckGo, Wikipedia FR/EN, YouTube)
// Robust client-side implementation with graceful fallbacks

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const query = (params.get("q") || '').trim();

  const loader = document.getElementById('loader');
  const webResults = document.getElementById('webResults');
  const wikiFrBody = document.getElementById('wikiFrBody');
  const wikiEnBody = document.getElementById('wikiEnBody');
  const ytBody = document.getElementById('ytBody');
  const speakBtn = document.getElementById('speakBtn');

  function showLoader(show) {
    if (!loader) return;
    loader.style.display = show ? 'block' : 'none';
    loader.setAttribute('aria-hidden', !show);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  // 1) WEB results via DuckDuckGo instant API (good general web results client-side)
  async function fetchWeb(q) {
    webResults.innerHTML = '<p>Chargement des résultats web…</p>';
    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&pretty=1`;
      const r = await fetch(url);
      if (!r.ok) throw new Error('DuckDuckGo non disponible');
      const data = await r.json();

      // Build list from RelatedTopics and Abstract
      const items = [];
      if (data.Abstract && data.AbstractURL) {
        items.push({title: data.Heading || 'Résultat', text: data.Abstract, url: data.AbstractURL});
      }
      (data.RelatedTopics || []).forEach(rt => {
        // RelatedTopics items can be nested
        if (rt.Text && rt.FirstURL) items.push({title: rt.Text.split(' - ')[0], text: rt.Text, url: rt.FirstURL});
        if (rt.Topics) rt.Topics.forEach(t => { if (t.Text && t.FirstURL) items.push({title: t.Text.split(' - ')[0], text: t.Text, url: t.FirstURL}); });
      });

      if (items.length === 0) {
        webResults.innerHTML = '<p>Aucun résultat web trouvé.</p>';
        return;
      }

      // Show top 6
      webResults.innerHTML = items.slice(0,6).map(it => `
        <article class="result-card">
          <div class="meta">
            <h3>${escapeHtml(it.title)}</h3>
            <p>${escapeHtml(it.text || '').slice(0,400)}</p>
            <p><a href="${it.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(it.url)}</a></p>
          </div>
        </article>
      `).join('');
    } catch (err) {
      console.warn('web fetch error', err);
      webResults.innerHTML = `<p>Erreur lors du chargement des résultats web.</p>`;
    }
  }

  // 2) Wikipedia summary (FR then EN)
  async function fetchWiki(lang, targetEl) {
    targetEl.innerHTML = `<p>Chargement Wikipedia (${lang})…</p>`;
    try {
      const endpoint = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      const r = await fetch(endpoint);
      if (!r.ok) {
        targetEl.innerHTML = `<p>Aucun article ${lang.toUpperCase()} trouvé.</p>`;
        return;
      }
      const data = await r.json();
      if (data && data.extract) {
        const thumb = data.thumbnail && data.thumbnail.source ? `<img class="thumbnail" src="${escapeHtml(data.thumbnail.source)}" alt="">` : '';
        const link = data.content_urls && data.content_urls.desktop && data.content_urls.desktop.page ? data.content_urls.desktop.page : `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(data.title)}`;
        targetEl.innerHTML = `
          <div class="result-card">
            ${thumb}
            <div class="meta">
              <h3>${escapeHtml(data.title)}</h3>
              <p>${escapeHtml(data.extract)}</p>
              <p><a href="${link}" target="_blank" rel="noopener noreferrer">Lire l’article sur Wikipedia →</a></p>
            </div>
          </div>
        `;
      } else {
        targetEl.innerHTML = `<p>Aucun résumé disponible en ${lang.toUpperCase()}.</p>`;
      }
    } catch (err) {
      console.warn('wiki fetch error', err);
      targetEl.innerHTML = `<p>Erreur lors de la récupération Wikipedia (${lang}).</p>`;
    }
  }

  // 3) YouTube — try to extract video IDs using a public text-extraction proxy (best-effort)
  // NOTE: client-side scraping may fail due to CORS. We try r.jina.ai which often gives text content.
  async function fetchYouTube(q) {
    ytBody.innerHTML = `<p>Chargement vidéos YouTube…</p>`;
    try {
      const proxy = `https://r.jina.ai/http://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
      const r = await fetch(proxy);
      if (!r.ok) throw new Error('YouTube proxy failed');
      const text = await r.text();

      // Find video IDs in the returned page text (look for "watch?v=")
      const ids = Array.from(new Set((text.match(/watch\?v=[\w-]{11}/g) || []).map(x => x.split('=')[1])));

      if (ids.length === 0) {
        ytBody.innerHTML = '<p>Aucune vidéo trouvée (ou blocage CORS/proxy).</p>';
        return;
      }

      // Build simple video cards (embed first 3)
      const videos = ids.slice(0, 6).map(id => {
        return {
          id,
          url: `https://www.youtube.com/watch?v=${id}`,
          embed: `https://www.youtube.com/embed/${id}`
        };
      });

      ytBody.innerHTML = videos.map(v => `
        <div class="yt-card">
          <iframe width="320" height="180" src="${v.embed}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          <p><a href="${v.url}" target="_blank" rel="noopener noreferrer">${v.url}</a></p>
        </div>
      `).join('');
    } catch (err) {
      console.warn('yt fetch error', err);
      ytBody.innerHTML = `<p>Impossible de charger YouTube (proxy ou CORS). Si vous voulez des vidéos fiables, on pourra ajouter une clé YouTube Data API plus tard.</p>`;
    }
  }

  // speak all displayed text
  if (speakBtn) {
    speakBtn.addEventListener('click', () => {
      const parts = [];
      if (webResults) parts.push(webResults.innerText);
      if (wikiFrBody) parts.push(wikiFrBody.innerText);
      if (wikiEnBody) parts.push(wikiEnBody.innerText);
      if (ytBody) parts.push(ytBody.innerText);
      const text = parts.join('\n\n').trim();
      if (!text) return;
      const ut = new SpeechSynthesisUtterance(text);
      // choose lang heuristic from query accents
      ut.lang = /[àâçéèêëîïôûùüœ]/i.test(query) ? 'fr-FR' : 'en-US';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(ut);
    });
  }

  // main runner
  async function runAll(q) {
    if (!q) {
      if (webResults) webResults.innerHTML = '<p>Aucune requête fournie.</p>';
      return;
    }
    showLoader(true);
    // start all in parallel (Wikipedia FR/EN + DuckDuckGo + YouTube)
    const jobs = [
      fetchWeb(q),
      fetchWiki('fr', wikiFrBody),
      fetchWiki('en', wikiEnBody),
      fetchYouTube(q)
    ];
    await Promise.allSettled(jobs);
    showLoader(false);
  }

  // kick off
  runAll(query);
});
