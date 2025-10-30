// scripts/generate_from_hf.js
// Usage: node scripts/generate_from_hf.js "Quel est Elon Musk ?"

import fetch from "node-fetch";
import fs from "fs";

const question = process.argv.slice(2).join(" ") || "Donne un article court sur l'intelligence artificielle.";

const HF_TOKEN = process.env.HF_API_KEY;
if (!HF_TOKEN) {
  console.error("HF_API_KEY manquante !");
  process.exit(1);
}

const MODEL = "google/flan-t5-small"; // tu peux changer de modèle

async function callHF(prompt) {
  const res = await fetch(`https://api-inference.huggingface.co/models/${MODEL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ inputs: prompt })
  });
  const data = await res.json();
  // selon modèle, réponse peut être data[0].generated_text ou data.generated_text
  const text = data?.[0]?.generated_text ?? data?.generated_text ?? JSON.stringify(data);
  return text;
}

(async () => {
  try {
    const out = await callHF(question);
    const filename = "generated/article-" + Date.now() + ".md";
    const content = `---\ntitle: "${question.replace(/"/g, '\\"')}"\n---\n\n${out}\n`;
    fs.mkdirSync("generated", { recursive: true });
    fs.writeFileSync(filename, content);
    console.log("✅ Généré :", filename);
  } catch (e) {
    console.error("Erreur HF:", e);
    process.exit(1);
  }
})();
