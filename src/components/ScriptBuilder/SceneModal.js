import React, { useState, useEffect, useRef } from "react";

export default function SceneModal({ show, onClose, onSave, onDelete, initialData, characters }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dialogues, setDialogues] = useState([]);
  const [selectedCharacterName, setSelectedCharacterName] = useState("");
  const [line, setLine] = useState("");
  const [isPlaying, setIsPlaying] = useState(false); // Track if dialogues are being played
  const [isLoading, setIsLoading] = useState(false); // Track if audio URLs are being fetched
  const currentAudioRef = useRef(null); // Store the current audio object
  const stopPlaybackRef = useRef(false); // Flag to stop the playback loop
  const audioCacheRef = useRef(new Map()); // Cache audio URLs

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setDialogues(
        initialData.dialogues?.map((d, index) => {
          const character = characters.find(c => c.id === d.characterId) || 
                           characters.find(c => c.name.toLowerCase() === (d.characterName || d.character)?.toLowerCase());
          return {
            id: d.id || `temp-${index}-${Date.now()}`,
            characterName: character?.name || d.characterName || d.character?.name || "",
            content: d.content || d.line || "",
            orderIndex: d.orderIndex ?? index,
            characterId: character?.id || d.characterId,
          };
        })?.sort((a, b) => a.orderIndex - b.orderIndex) || []
      );
    } else {
      console.log("Resetting modal for new scene");
      setName("");
      setDescription("");
      setDialogues([]);
      setSelectedCharacterName("");
      setLine("");
    }
    // Clear cache when dialogues change
    audioCacheRef.current.clear();
  }, [initialData, characters]);

  const handleAddDialogue = () => {
    if (!selectedCharacterName || !line.trim()) {
      alert("Please select a character and enter a line");
      return;
    }

    const character = characters.find(c => c.name.toLowerCase() === selectedCharacterName.toLowerCase());
    if (!character) {
      alert("Invalid character selected");
      return;
    }

    const newDialogue = {
      id: `temp-${dialogues.length}-${Date.now()}`,
      characterName: character.name,
      content: line.trim(),
      orderIndex: dialogues.length > 0 ? Math.max(...dialogues.map(d => d.orderIndex)) + 1 : 0,
      characterId: character.id,
    };

    setDialogues((prev) => {
      const updated = [...prev, newDialogue];
      console.log("Added dialogue, new dialogues:", JSON.stringify(updated, null, 2));
      // Clear cache to ensure fresh audio for new dialogues
      audioCacheRef.current.clear();
      return updated;
    });
    setLine("");
    setSelectedCharacterName("");
  };

  const handleDeleteDialogue = (id) => {
    setDialogues((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      console.log(`Deleted dialogue with id ${id}, remaining dialogues:`, JSON.stringify(updated, null, 2));
      // Clear cache to avoid stale URLs
      audioCacheRef.current.clear();
      return updated;
    });
  };

  const handlePlayAllDialogues = async () => {
    if (isPlaying || isLoading) return; // Prevent multiple plays or plays during loading
    if (dialogues.length === 0) {
      alert("No dialogues to play");
      return;
    }

    setIsPlaying(true);
    setIsLoading(true);
    stopPlaybackRef.current = false;

    try {
      const sortedDialogues = [...dialogues].sort((a, b) => a.orderIndex - b.orderIndex);
      for (const dialogue of sortedDialogues) {
        if (stopPlaybackRef.current) break; // Exit loop if stop is triggered

        const character = characters.find(c => c.id === dialogue.characterId);
        if (!character || !character.voiceId) {
          console.warn(`Skipping dialogue for ${dialogue.characterName}: No voiceId`);
          alert(`Skipping dialogue for ${dialogue.characterName}: No voice assigned`);
          continue;
        }

        const cacheKey = `${dialogue.content}-${character.voiceId}`; // Unique key for cache
        let audioUrl = audioCacheRef.current.get(cacheKey);

        if (!audioUrl) {
          try {
            console.log(`Requesting audio for ${dialogue.characterName}:`, {
              text: dialogue.content,
              voiceId: character.voiceId,
            });

            const response = await fetch("http://localhost:3001/api/narakeet/tts", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: dialogue.content,
                voiceId: character.voiceId,
              }),
            });

            console.log(`Response status: ${response.status}, Headers:`, response.headers.get("Content-Type"));

            if (!response.ok) {
              const contentType = response.headers.get("Content-Type") || "unknown";
              let errorMessage = `Failed to generate audio (Status: ${response.status})`;

              if (contentType.includes("text/html")) {
                const text = await response.text();
                console.error("Received HTML response:", text.slice(0, 100));
                errorMessage = `Server returned HTML instead of JSON (Status: ${response.status})`;
              } else {
                const errorData = await response.json().catch(() => ({}));
                errorMessage = errorData.error || `Failed to generate audio (Status: ${response.status})`;
              }

              throw new Error(errorMessage);
            }

            if (!response.headers.get("Content-Type")?.includes("application/json")) {
              const text = await response.text();
              console.error("Non-JSON response:", text.slice(0, 100));
              throw new Error("Server did not return JSON");
            }

            const responseData = await response.json();
            audioUrl = responseData.audioUrl;
            audioCacheRef.current.set(cacheKey, audioUrl); // Cache the URL
            console.log(`Cached audio for ${cacheKey}: ${audioUrl}`);
          } catch (error) {
            console.error(`Error fetching audio for ${dialogue.characterName}:`, error);
            alert(`Failed to fetch audio for ${dialogue.characterName}: ${error.message}`);
            continue;
          }
        } else {
          console.log(`Using cached audio for ${dialogue.characterName}: ${audioUrl}`);
        }

        try {
          await new Promise((resolve, reject) => {
            const audio = new Audio(audioUrl);
            currentAudioRef.current = audio; // Store the current audio
            audio.onended = () => {
              currentAudioRef.current = null; // Clear when done
              resolve();
            };
            audio.onerror = () => {
              currentAudioRef.current = null;
              reject(new Error("Audio playback failed"));
            };
            audio.play();
          });
        } catch (error) {
          console.error(`Error playing dialogue for ${dialogue.characterName}:`, error);
          alert(`Failed to play dialogue for ${dialogue.characterName}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error("Error during dialogue playback:", error);
    } finally {
      setIsPlaying(false);
      setIsLoading(false);
      currentAudioRef.current = null;
      stopPlaybackRef.current = false;
    }
  };

  const handleStopPlayback = () => {
    if (!isPlaying) return;

    stopPlaybackRef.current = true; // Signal to stop the loop
    if (currentAudioRef.current) {
      currentAudioRef.current.pause(); // Stop the current audio
      currentAudioRef.current = null; // Clear the reference
    }
    setIsPlaying(false); // Reset playing state
    setIsLoading(false); // Reset loading state
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content cp-bg-dark text-white cp-rounded-sm border-0">
          <div className="modal-header border-0 cp-bg-purple px-4 d-flex justify-content-between">
            <h6 className="modal-title">{initialData ? "Edit Scene" : "Add Scene"}</h6>
            <div className="cp-pointer" onClick={onClose}>
              <i className="bi bi-x-lg opacity-75"></i>
            </div>
          </div>
          <div className="modal-body p-4">
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Scene Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <textarea
              className="form-control mb-3"
              placeholder="Scene Description"
              value={description}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="cp-divider mb-3"></div>
            <div className="d-flex mb-3 gap-2">
              <select
                className="form-select"
                value={selectedCharacterName}
                onChange={(e) => setSelectedCharacterName(e.target.value)}
              >
                <option value="">Select Character</option>
                {characters.map((char) => (
                  <option key={char.id} value={char.name}>
                    {char.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="form-control"
                placeholder="Dialogue Line"
                value={line}
                onChange={(e) => setLine(e.target.value)}
              />
              <button className="btn cp-btn-dark cp-green" onClick={handleAddDialogue}>
                <i className="bi bi-plus-lg cp-text-green"></i>
              </button>
            </div>
            {dialogues.length > 0 && (
              <div className="border-0 cp-rounded-sm py-2 px-3 cp-bg-darker">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Dialogues:</strong>
                  <div className="d-flex align-items-center gap-2">
                    {isLoading && (
                      <>
                        <span className="spinner-grow spinner-grow-sm cp-text-green" aria-hidden="true"></span>
                        <span className="visually-hidden" role="status">Loading...</span>
                      </>
                    )}
                    <i
                      className={`bi ${isPlaying ? "bi-stop-circle" : "bi-play-circle"} cp-pointer ${
                        dialogues.some(d => characters.find(c => c.id === d.characterId)?.voiceId)
                          ? "cp-text-green"
                          : "cp-text-purple"
                      }`}
                      onClick={isPlaying ? handleStopPlayback : handlePlayAllDialogues}
                      title={
                        dialogues.some(d => characters.find(c => c.id === d.characterId)?.voiceId)
                          ? isPlaying
                            ? "Stop playback"
                            : isLoading
                            ? "Loading audio..."
                            : "Play all dialogues"
                          : "No dialogues with assigned voices"
                      }
                    ></i>
                  </div>
                </div>
                {dialogues
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((d) => (
                    <div
                      key={d.id}
                      className="d-flex justify-content-between align-items-center mb-2"
                    >
                      <div>
                        <strong>{d.characterName || "Unknown"}:</strong> {d.content}
                      </div>
                      <i
                        className="bi bi-trash cp-text-red cp-pointer"
                        onClick={() => handleDeleteDialogue(d.id)}
                      ></i>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div className="modal-footer border-0 px-4 pt-0 pb-4">
            {initialData?.id && (
              <button
                className="btn cp-btn-dark me-auto cp-red"
                onClick={() => onDelete(initialData.id)}
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
                console.log("Saving scene with dialogues:", JSON.stringify(dialogues, null, 2));
                onSave({
                  id: initialData?.id || null,
                  name: name.trim(),
                  description: description.trim() || null,
                  dialogues,
                });
                setName("");
                setDescription("");
                setDialogues([]);
                setSelectedCharacterName("");
                setLine("");
              }}
              disabled={!name.trim()}
            >
              {initialData ? "Update" : "Add Scene"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}