import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 5050;

// ✅ Middleware
app.use(express.json());

// ✅ CORS - Top-level and preflight safe
app.use(cors());
app.options("/api/generate", cors());

app.post("/api/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
