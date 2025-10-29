document.getElementById('generateBtn').addEventListener('click', () => {
  const topic = document.getElementById('topic').value.trim();
  if (topic === "") {
    alert("Veuillez entrer un sujet avant de générer.");
  } else {
    alert(`L'IA va bientôt rédiger un article sur : "${topic}"`);
  }
});

document.getElementById('searchBtn').addEventListener('click', () => {
  const search = document.getElementById('search').value.trim();
  if (search) {
    alert(`Recherche de l'article : "${search}"`);
  }
});
