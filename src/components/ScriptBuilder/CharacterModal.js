import React, { useState, useEffect } from "react";
import narakeetVoices from "../../constants/narakeetVoices";

export default function CharacterModal({ show, onClose, onSave, onDelete, initialData }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#55af65");
  const [voiceId, setVoiceId] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(null);

  useEffect(() => {
    if (initialData) {
      console.log('Initial data received:', JSON.stringify(initialData, null, 2)); // ADDED: Debug initialData
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setColor(initialData.color || "#55af65");
      setVoiceId(initialData.voiceId || "");
      setAudioUrl(null);
      setAudioLoading(false);
      setAudioError(null);
    } else {
      console.log("Resetting modal for new character");
      setName("");
      setDescription("");
      setColor("#55af65");
      setVoiceId("");
      setAudioUrl(null);
      setAudioLoading(false);
      setAudioError(null);
    }
  }, [initialData]);

  const handleVoiceChange = async (newVoiceId) => {
    console.log('Voice changed to:', newVoiceId); // ADDED: Debug voice change
    setVoiceId(newVoiceId);
    setAudioUrl(null);
    setAudioError(null);
    setAudioLoading(true);

    const voice = narakeetVoices.find((v) => v.id === newVoiceId);
    const sampleText = `Hi, my name is ${voice ? voice.displayName : "Unknown"}`;

    try {
      const response = await fetch("http://localhost:3001/api/narakeet/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sampleText,
          voiceId: newVoiceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to generate audio");
      }

      const data = await response.json();
      const fullAudioUrl = data.audioUrl.startsWith('http') ? data.audioUrl : `http://localhost:3001${data.audioUrl}`;
      setAudioUrl(fullAudioUrl);
    } catch (error) {
      console.error("Error generating audio:", error);
      setAudioError(error.message || "Failed to play voice sample. Please check the voice ID or try again.");
    } finally {
      setAudioLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content cp-bg-dark text-white cp-rounded-sm border-0">
          <div className="modal-header border-0 cp-bg-purple px-4 d-flex justify-content-between">
            <h6 className="modal-title">{initialData ? "Edit Character" : "Add Character"}</h6>
            <div className="cp-pointer" onClick={onClose}>
              <i className="bi bi-x-lg opacity-75"></i>
            </div>
          </div>
          <div className="modal-body p-4">
            <div className="d-flex gap-2 mb-2 align-items-center">
              <input
                type="color"
                className="form-control form-control-color p-0 rounded-circle"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                title="Choose character color"
              />
              <input
                type="text"
                className="form-control cp-rounded-sm"
                placeholder="Character Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <textarea
              className="form-control mb-2 cp-rounded-sm"
              placeholder="Character Description"
              value={description}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="d-flex align-items-center gap-2 mb-3">
              <select
                className="form-select cp-rounded-sm"
                value={voiceId}
                onChange={(e) => handleVoiceChange(e.target.value)}
              >
                <option value="">Assign Voice</option>
                {narakeetVoices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name}
                  </option>
                ))}
              </select>
              {audioLoading && <div class="spinner-grow cp-text-purple" role="status">
                                  <span class="visually-hidden">Loading...</span>
                              </div>}
            </div>
            {audioError && <div className="text-danger mb-3">{audioError}</div>}
            {audioUrl && (
              <audio
                src={audioUrl}
                autoPlay
                style={{ display: "none" }}
                onError={() => setAudioError("Failed to play audio file. Check if the file is accessible.")}
              />
            )}
          </div>
          <div className="modal-footer border-0 px-4 pt-0 pb-4">
            {initialData?.id && (
              <button
                className="btn cp-btn-dark me-auto cp-red"
                onClick={() => {
                  console.log("Deleting character with id:", initialData.id);
                  onDelete(initialData.id);
                }}
              >
                <i className="bi bi-trash cp-text-red me-2"></i>
                Delete
              </button>
            )}
            <button className="btn cp-btn-dark" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn cp-btn-green"
              onClick={() => {
                const characterData = {
                  id: initialData?.id || null,
                  name,
                  description: description.trim() || null,
                  color,
                  voiceId
                };
                console.log('Saving character:', JSON.stringify(characterData, null, 2)); // ADDED: Detailed save log
                onSave(characterData);
                setName("");
                setDescription("");
                setColor("#55af65");
                setVoiceId("");
                setAudioUrl(null);
                setAudioLoading(false);
                setAudioError(null);
              }}
              disabled={!name.trim()}
            >
              {initialData ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}