import { useState } from "react";

export default function useOpenAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callOpenAI = async (prompt, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5050/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content.trim();
      } else {
        throw new Error("No response from OpenAI.");
      }
    } catch (err) {
      setError(err.message || "An error occurred.");
      console.error("OpenAI Error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { callOpenAI, loading, error };
}
