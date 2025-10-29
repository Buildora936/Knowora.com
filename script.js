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
const chatBox = document.getElementById("chat-box");
const userQuestion = document.getElementById("user-question");
const askBtn = document.getElementById("ask-btn");
const copyBtn = document.getElementById("copy-btn");

let lastAnswer = "";

askBtn.addEventListener("click", async () => {
    const question = userQuestion.value.trim();
    if (!question) return alert("Veuillez poser une question.");

    // Ajouter la question au chat
    const userDiv = document.createElement("div");
    userDiv.innerHTML = `<b>Vous :</b> ${question}`;
    userDiv.style.margin = "10px 0";
    chatBox.appendChild(userDiv);

    // Zone de réponse de l'AI
    const aiDiv = document.createElement("div");
    aiDiv.innerHTML = `<b>AI :</b> <span id="typing">...</span>`;
    aiDiv.style.margin = "10px 0";
    chatBox.appendChild(aiDiv);

    chatBox.scrollTop = chatBox.scrollHeight;
    userQuestion.value = "";

    try {
        const res = await fetch("https://api-inference.huggingface.co/models/gpt2", {
            method: "POST",
            headers: {
                "Authorization": "Bearer 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",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ inputs: question })
        });

        const data = await res.json();
        let answer = data[0]?.generated_text || "Pas de réponse disponible.";
        lastAnswer = answer;

        // Animation typing
        let i = 0;
        const typingSpan = document.getElementById("typing");
        typingSpan.innerText = "";
        const interval = setInterval(() => {
            if (i < answer.length) {
                typingSpan.innerText += answer[i];
                i++;
                chatBox.scrollTop = chatBox.scrollHeight;
            } else {
                clearInterval(interval);
            }
        }, 20);

    } catch (err) {
        document.getElementById("typing").innerText = "Erreur de connexion à l'API.";
        console.error(err);
    }
});

// Copier la dernière réponse
copyBtn.addEventListener("click", () => {
    if (lastAnswer) {
        navigator.clipboard.writeText(lastAnswer)
            .then(() => alert("Réponse copiée !"))
            .catch(() => alert("Impossible de copier."));
    } else {
        alert("Aucune réponse à copier.");
    }
});
