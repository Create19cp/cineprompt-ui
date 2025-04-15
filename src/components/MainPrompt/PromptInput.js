import React, { useState, useEffect } from "react";
import useOpenAI from "../../hooks/useOpenAI";

export default function PromptInput({ script, setScript, characters, setCharacters, scenes, selectedTones }) {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const { callOpenAI, loading, error } = useOpenAI();
  const [isDictating, setIsDictating] = useState(false);
  const [dictationError, setDictationError] = useState("");
  const recognitionRef = React.useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setDictationError("Speech recognition not supported in this browser.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "en-US";

    recognitionRef.current.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      setPrompt(transcript);
      setDictationError("");
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setDictationError(
        event.error === "no-speech"
          ? "No speech detected. Try again."
          : "Speech recognition error. Please try again."
      );
      setIsDictating(false);
    };

    recognitionRef.current.onend = () => {
      setIsDictating(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Toggle dictation
  const handleDictation = () => {
    if (!recognitionRef.current) {
      setDictationError("Speech recognition not supported.");
      return;
    }

    if (isDictating) {
      recognitionRef.current.stop();
      setIsDictating(false);
    } else {
      setPrompt("");
      setDictationError("");
      recognitionRef.current.start();
      setIsDictating(true);
    }
  };

  // Send prompt to AI
  const handleSend = async () => {
    if (!prompt.trim()) return;
    const context = `
      Script so far:\n${script}\n
      Characters:\n${characters.map((c) => c.name).join(", ")}\n
      Tone:\n${selectedTones.map((t) => t.name || t).join(", ")}\n
      Scenes:\n${scenes.map((s) => `${s.name}: ${s.description || ""}`).join("\n")}\n
    `;
    const fullPrompt = `${context}\n\n${prompt}`;
    const aiResponse = await callOpenAI(fullPrompt);
    if (aiResponse) {
      setResponse(aiResponse);
      setPrompt("");
    }
  };

  // Insert AI response into script
  const handleInsert = () => {
    if (!response) return;

    setScript((prev) => `${prev.trim()}\n\n${response}`);

    // Detect new character names
    const matches = response.match(/^[A-Z][A-Z\s]{1,30}(?=\:)/gm);
    const newNames = matches
      ? [...new Set(matches.map((name) => name.trim()))].filter(
          (name) => !characters.find((c) => c.name.toUpperCase() === name.toUpperCase())
        )
      : [];

    if (newNames.length > 0) {
      const newChars = newNames.map((name) => ({
        id: Date.now() + Math.random(),
        name: name.trim(),
        description: "",
      }));
      setCharacters((prev) => [...prev, ...newChars]);
    }

    setResponse("");
  };

  return (
    <div id="cp-main-prompt" className="mt-4">
      <div className="cp-bg-dark cp-rounded p-three d-flex gap-2">
        <div className="w-100">
          <input
            type="text"
            className={`form-control border-0 cp-rounded-sm py-2 text-white cp-bg-darker ${
              isDictating ? "cp-dictating" : ""
            }`}
            placeholder={isDictating ? "Start Speaking..." : "Ask AI"}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setDictationError("");
            }}
            disabled={isDictating}
          />
        </div>
        <button
          className={`btn cp-btn-dark ${isDictating ? "cp-bg-green animate-pulse" : ""}`}
          onClick={handleDictation}
          disabled={!recognitionRef.current}
          title={isDictating ? "Stop dictation" : "Start dictation"}
        >
          <i className={`bi ${isDictating ? "bi-mic-mute-fill" : "bi-mic-fill"} cp-text-green`}></i>
        </button>
        <button className="btn cp-btn-green" onClick={handleSend} disabled={loading || !prompt.trim()}>
          {loading ? (
            <span className="spinner-border spinner-border-sm"></span>
          ) : (
            <i className="bi bi-send-fill"></i>
          )}
        </button>
      </div>

      {(error || dictationError) && (
        <div className="text-danger mt-2 small">
          <i className="bi bi-exclamation-circle me-2"></i>
          {error || dictationError}
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