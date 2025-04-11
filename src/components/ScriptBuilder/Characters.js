import React, { useState } from "react";
import CharacterModal from "./CharacterModal";
import { useProject } from "../../context/ProjectContext";

export default function Characters({ characters, setCharacters }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(null);

  const { updateProject } = useProject(); // ✅ project context

  const handleSave = (character) => {
    setCharacters((prev) => {
      const exists = prev.find((c) => c.id === character.id);
      const updated = exists
        ? prev.map((c) => (c.id === character.id ? character : c))
        : [...prev, character];

      updateProject({ characters: updated }); // ✅ save to project

      return updated;
    });

    setModalOpen(false);
    setEditingCharacter(null);
  };

  const handleDelete = (id) => {
    setCharacters((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      updateProject({ characters: updated }); // ✅ sync deletion
      return updated;
    });

    setModalOpen(false);
    setEditingCharacter(null);
  };

  return (
    <div id="cp-script-characters">
      <div className="d-flex align-items-center mb-2 gap-2">
        <p className="mb-0 fw-600 opacity-50 ms-1">Characters</p>
        <i
          className="bi bi-plus-square-fill cp-text-green cp-pointer"
          role="button"
          onClick={() => {
            setEditingCharacter(null);
            setModalOpen(true);
          }}
        ></i>
      </div>

      <div className="d-flex flex-wrap gap-2">
        {characters.map((char) => (
          <div
            key={char.id}
            className="cp-bg-darker px-3 py-2 cp-rounded-sm position-relative overflow-hidden"
          >
            <div className="position-relative z-front d-flex gap-2 align-items-center">
              <i className="bi bi-person-fill cp-text-green opacity-50"></i>
              <span className="cp-text-color fw-600 fs-14 me-3">{char.name}</span>
              <div
                onClick={() => {
                  setEditingCharacter(char);
                  setModalOpen(true);
                }}
              >
                <i className="bi bi-pencil-fill text-white opacity-50 fs-14 cp-pointer"></i>
              </div>
            </div>
            <div className="cp-chip z-back"></div>
          </div>
        ))}
      </div>

      <CharacterModal
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        initialData={editingCharacter}
      />
    </div>
  );
}
