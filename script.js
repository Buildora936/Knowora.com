// Détection de langue
const userLang = navigator.language || navigator.userLanguage;
if (userLang.startsWith('en')) {
  document.querySelector('#slogan').textContent = "Knowledge at your fingertips";
  document.querySelector('#searchInput').placeholder = "Search...";
}
/* ----------------- THEME SOMBRE ----------------- */
const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  // Change icon
  themeToggle.textContent =
    document.body.classList.contains("dark") ? "☀️" : "🌙";

  // Sauvegarde du thème
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});

// Charger thème sauvegardé
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀️";
}

/* ----------------- HISTORIQUE ----------------- */
function loadHistory() {
  let hist = JSON.parse(localStorage.getItem("history") || "[]");
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  hist.slice(-8).reverse().forEach(item => {
    let li = document.createElement("li");
    li.textContent = item;
    li.onclick = () => window.location.href = `search.html?q=${encodeURIComponent(item)}`;
    list.appendChild(li);
  });
}
loadHistory();

function saveHistory(q) {
  let hist = JSON.parse(localStorage.getItem("history") || "[]");
  if (!hist.includes(q)) hist.push(q);
  localStorage.setItem("history", JSON.stringify(hist));
}

/* ----------------- RECHERCHE ----------------- */
document.querySelector('#searchBtn').addEventListener('click', () => {
  const query = document.querySelector('#searchInput').value.trim();
  if (query) {
    saveHistory(query);
    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
  }
});

/* ----------------- SUGGESTIONS ----------------- */
const suggestionsBox = document.getElementById("suggestions");

document.getElementById("searchInput").addEventListener("input", async (e) => {
  const q = e.target.value.trim();
  if (!q) {
    suggestionsBox.style.display = "none";
    return;
  }

  const res = await fetch(`https://api.duckduckgo.com/?q=${q}&format=json`);
  const data = await res.json();

  suggestionsBox.innerHTML = "";

  if (data.RelatedTopics) {
    data.RelatedTopics.slice(0, 5).forEach(item => {
      if (item.Text) {
        let li = document.createElement("li");
        li.textContent = item.Text;
        li.onclick = () => {
          document.querySelector('#searchInput').value = item.Text;
          suggestionsBox.style.display = "none";
        };
        suggestionsBox.appendChild(li);
      }
    });
  }

  suggestionsBox.style.display = "block";
});

/* ----------------- MICRO (AUDIO) ----------------- */
const voiceBtn = document.getElementById("voiceBtn");
const recognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

if (recognitionAPI) {
  const rec = new recognitionAPI();
  rec.lang = "fr-FR";

  voiceBtn.onclick = () => rec.start();

  rec.onresult = (event) => {
    const text = event.results[0][0].transcript;
    document.getElementById("searchInput").value = text;
  };
} else {
  voiceBtn.style.display = "none"; // si navigateur ne supporte pas
}

// --- AUDIO ---
let audioEnabled = false;

document.getElementById("audioToggle").addEventListener("click", () => {
    audioEnabled = !audioEnabled;
    if (audioEnabled) {
        document.getElementById("audioToggle").innerText = "🔊 Audio ON";
    } else {
        document.getElementById("audioToggle").innerText = "🔈 Audio OFF";
    }
});

// Fonction pour jouer un son
function playSound(type) {
    if (!audioEnabled) return;

    const audio = new Audio(`sounds/${type}.mp3`);
    audio.volume = 0.3;
    audio.play();
}
const micBtn = document.getElementById("micBtn");
let recognition;

try {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "fr-FR";

  micBtn.addEventListener("click", () => {
    recognition.start();
    micBtn.classList.add("listening");
  });

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    document.querySelector("#searchInput").value = text;
    micBtn.classList.remove("listening");
  };

  recognition.onerror = () => {
    micBtn.classList.remove("listening");
  };

} catch (e) {
  console.log("Micro non supporté");
}
