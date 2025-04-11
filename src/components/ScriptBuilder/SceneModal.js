import React, { useState, useEffect } from "react";

export default function SceneModal({ show, onClose, onSave, onDelete, initialData, characters, isEditing }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dialogues, setDialogues] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState("");
  const [line, setLine] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setDialogues(initialData.dialogues || []);
    } else {
      setName("");
      setDescription("");
      setDialogues([]);
    }
  }, [initialData]);

  const handleAddDialogue = () => {
    if (!selectedCharacter || !line.trim()) return;

    const newDialogue = {
      id: Date.now(),
      character: selectedCharacter,
      line: line.trim(),
    };

    setDialogues((prev) => [...prev, newDialogue]);
    setLine("");
  };

  const handleDeleteDialogue = (id) => {
    setDialogues((prev) => prev.filter((d) => d.id !== id));
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content cp-bg-dark text-white cp-rounded-sm border-0">

          {/* Header */}
          <div className="modal-header border-0 cp-bg-purple px-4 d-flex justify-content-between">
            <h6 className="modal-title">{initialData ? "Edit Scene" : "Add Scene"}</h6>
            <div className="cp-pointer" onClick={onClose}>
              <i className="bi bi-x-lg opacity-75"></i>
            </div>
          </div>

          {/* Body */}
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
            ></textarea>

            <div className="cp-divider mb-3"></div>

            <div className="d-flex mb-3 gap-2">
              <select
                className="form-select"
                value={selectedCharacter}
                onChange={(e) => setSelectedCharacter(e.target.value)}
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
              <button className="btn cp-btn-green" onClick={handleAddDialogue}>
                Add
              </button>
            </div>

            {/* Dialogue List */}
            {dialogues.length > 0 && (
              <div className="border-0 cp-rounded-sm py-2 px-3 cp-bg-darker">
                {dialogues.map((d) => (
                  <div key={d.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{d.character}:</strong> {d.line}
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

          {/* Footer */}
            <div className="modal-footer border-0 px-4 pt-0 pb-4">
            {isEditing && (
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
                onClick={() =>
                onSave({
                    id: initialData?.id || Date.now(),
                    name,
                    description,
                    dialogues,
                })
                }
                disabled={!name.trim() || !description.trim()}
            >
                {isEditing ? "Update" : "Add"}
            </button>
            </div>


        </div>
      </div>
    </div>
  );
}
