import React, { useState, useEffect } from "react";

export default function SceneModal({ show, onClose, onSave, onDelete, initialData, characters }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dialogues, setDialogues] = useState([]);
  const [selectedCharacterName, setSelectedCharacterName] = useState("");
  const [line, setLine] = useState("");

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
      return updated;
    });
    setLine("");
    setSelectedCharacterName("");
  };

  const handleDeleteDialogue = (id) => {
    setDialogues((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      console.log(`Deleted dialogue with id ${id}, remaining dialogues:`, JSON.stringify(updated, null, 2));
      return updated;
    });
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
                {dialogues
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((d) => (
                    <div
                      key={d.id}
                      className="d-flex justify-content-between align-items-center"
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