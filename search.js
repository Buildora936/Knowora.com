const params = new URLSearchParams(window.location.search);
const query = params.get("q");

async function searchKnowora(query) {
  const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
  const frWikiUrl = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;

  let content = `<h2>Résultats pour "${query}"</h2>`;

  try {
    const resFr = await fetch(frWikiUrl);
    const dataFr = await resFr.json();
    if (dataFr.extract) {
      content += `<div><h3>🇫🇷 Wikipedia (FR)</h3><p>${dataFr.extract}</p></div>`;
    }
  } catch {}

  try {
    const resEn = await fetch(wikiUrl);
    const dataEn = await resEn.json();
    if (dataEn.extract) {
      content += `<div><h3>🇬🇧 Wikipedia (EN)</h3><p>${dataEn.extract}</p></div>`;
    }
  } catch {}

  if (!content.includes("<p>")) {
    content += `<p>Aucun résultat trouvé.</p>`;
  }

  document.querySelector("#results").innerHTML = content;
}

if (query) searchKnowora(query);
document.querySelector("#speakBtn").addEventListener("click", () => {
  const text = document.querySelector("#results").innerText;
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "fr-FR";
  window.speechSynthesis.speak(speech);
});
