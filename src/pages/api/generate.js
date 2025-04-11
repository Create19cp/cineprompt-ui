// /pages/api/generate.js
export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }
  
    const { prompt } = req.body;
  
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ error: "Prompt is required" });
    }
  
    try {
      const apiKey = process.env.OPENAI_API_KEY;
  
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4", // or "gpt-3.5-turbo" if using that
          messages: [
            {
              role: "system",
              content: "You are a helpful AI assistant for screenwriting and storytelling.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      });
  
      if (!response.ok) {
        const error = await response.json();
        return res.status(response.status).json({ error: error.error || "OpenAI error" });
      }
  
      const data = await response.json();
      const result = data.choices[0]?.message?.content || "";
  
      res.status(200).json({ result });
    } catch (err) {
      console.error("OpenAI API error:", err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
  