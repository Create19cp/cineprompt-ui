import React, { useState } from "react";
import useOpenAI from "../../hooks/useOpenAI";

export default function PromptInput({ script, setScript, characters, setCharacters, scenes, selectedTones }) {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const { callOpenAI, loading, error } = useOpenAI();

  const handleSend = async () => {
    if (!prompt.trim()) return;
    const context = `
      Script so far:\n${script}\n
      Characters:\n${characters.map(c => c.name).join(", ")}\n
      Tone:\n${selectedTones.map(t => t.name || t).join(", ")}\n
      Scenes:\n${scenes.map(s => `${s.name}: ${s.description}`).join("\n")}\n
    `;
    const fullPrompt = `${context}\n\n${prompt}`;
    const aiResponse = await callOpenAI(fullPrompt);
    if (aiResponse) {
      setResponse(aiResponse);
    }
  };

  const handleInsert = () => {
    if (!response) return;

    setScript((prev) => `${prev.trim()}\n\n${response}`);

    // 🔍 Try to detect new character names
    const matches = response.match(/^[A-Z][A-Z\s]{1,30}(?=\:)/gm); // e.g., JOHN:
    const newNames = matches
      ? [...new Set(matches.map(name => name.trim()))].filter(
          name => !characters.find(c => c.name.toUpperCase() === name.toUpperCase())
        )
      : [];

    if (newNames.length > 0) {
      const newChars = newNames.map(name => ({
        id: Date.now() + Math.random(),
        name: name.trim(),
        description: "",
      }));
      setCharacters((prev) => [...prev, ...newChars]);
    }

    setResponse("");
    setPrompt("");
  };

  return (
    <div id="cp-main-prompt" className="mt-4">
      <div className="cp-bg-dark cp-rounded p-three d-flex gap-3 align-items-end">
        <div className="w-100">
          <input
            type="text"
            className="form-control border-0 cp-rounded-sm py-2 text-white cp-bg-darker"
            placeholder="Ask AI"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        <button className="btn cp-btn-dark" disabled>
          <i className="bi bi-mic-fill cp-text-green"></i>
        </button>
        <button className="btn cp-btn-green" onClick={handleSend} disabled={loading}>
          {loading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-send-fill"></i>}
        </button>
      </div>

      {error && (
        <div className="text-danger mt-2 small">
          <i className="bi bi-exclamation-circle me-2"></i>
          {error}
        </div>
      )}

      {response && (
        <div className="cp-bg-dark cp-rounded mt-3 p-four">
          <p className="mb-2 fw-600 opacity-50 text-white ms-2">AI Suggests:</p>
          <pre className="text-white cp-bg-darker p-4 cp-rounded-sm" style={{ whiteSpace: "pre-wrap" }}>
            {response}
          </pre>
          <div className="mt-3">
            <button className="btn cp-btn-dark cp-green" onClick={handleInsert}>
              <i className="bi bi-plus-lg cp-text-green me-2"></i> Insert into Script
            </button>
          </div>
        </div>
      )}
    </div>
  );
}