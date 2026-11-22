import express from "express";
import { Mistral } from "@mistralai/mistralai";

const port = process.env.PORT || 3000;

if (!process.env.MISTRAL_API_KEY) {
  console.error("MISTRAL_API_KEY manquante. Créez un fichier .env ou exportez la variable.");
  process.exit(1);
}

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
const app = express();

app.use(express.static("public"));
app.use(express.json());

app.post("/api/itinerary", async (req, res) => {
  const { pays = [], jours, budget = "modéré", interets = "" } = req.body ?? {};
  const destinations = Array.isArray(pays) ? pays.filter(Boolean) : [];
  if (destinations.length === 0 || !Number.isInteger(Number(jours)) || Number(jours) < 1) {
    return res.status(400).json({ error: "pays (au moins un) et jours (entier ≥ 1) requis" });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  try {
    const stream = await client.chat.stream({
      model: "mistral-small-latest",
      responseFormat: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Tu es un expert des voyages en Scandinavie et dans les pays nordiques. " +
            "Réponds en français. Réponds uniquement avec un objet JSON valide, sans texte autour, " +
            "avec exactement cette structure : " +
            '{"titre": string, "jours": [{"jour": number, "ville": string, "pays": string, ' +
            '"activites": [string], "conseils": string}], "budget_estime": string}.',
        },
        {
          role: "user",
          content:
            `Crée un itinéraire de ${Number(jours)} jour(s) dans les pays suivants : ${destinations.join(", ")}. ` +
            `Budget : ${budget}. Centres d'intérêt : ${interets || "généraliste"}.`,
        },
      ],
    });
    for await (const chunk of stream) {
      const content = chunk.data.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error(err);
    res.write(`data: ${JSON.stringify({ error: "échec de l'appel à l'API Mistral" })}\n\n`);
    res.end();
  }
});

app.listen(port, () => {
  console.log(`Planificateur de voyage nordique sur http://localhost:${port}`);
});
