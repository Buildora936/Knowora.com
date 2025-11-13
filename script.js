// Détection automatique de la langue
const userLang = navigator.language || navigator.userLanguage;
if (userLang.startsWith('en')) {
  document.querySelector('#slogan').textContent = "Knowledge at your fingertips";
  document.querySelector('#searchInput').placeholder = "Search...";
}

// Recherche et redirection
document.querySelector('#searchBtn').addEventListener('click', () => {
  const query = document.querySelector('#searchInput').value.trim();
  if (query) {
    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
  }
});
