import React, { useState } from "react";
import CharacterModal from "./CharacterModal";

export default function CharacterList({ characters, setCharacters }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async (character) => {
    try {
      if (!character.name || !character.name.trim()) {
        alert("Character name is required");
        return;
      }

      const characterData = {
        id: character.id || null,
        name: character.name.trim(),
        description: character.description || null,
        color: character.color || "#FFFFFF",
      };

      console.log("Saving character:", JSON.stringify(characterData, null, 2));

      setCharacters((prev) => {
        if (isEditing && characterData.id) {
          return prev.map((c) => (c.id === characterData.id ? characterData : c));
        }
        return [...prev, { ...characterData, id: `temp-${Date.now()}` }];
      });

      setModalOpen(false);
      setEditingCharacter(null);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving character:", error);
      alert(`Failed to save character: ${error.message}`);
    }
  };

  const handleDelete = (id) => {
    try {
      console.log("Deleting character with id:", id);
      setCharacters((prev) => prev.filter((c) => c.id !== id));
      setModalOpen(false);
      setEditingCharacter(null);
      setIsEditing(false);
    } catch (error) {
      console.error("Error deleting character:", error);
      alert(`Error deleting character: ${error.message}`);
    }
  };

  return (
    <div id="cp-characters">
      <div className="d-flex align-items-center mb-2 gap-2">
        <p className="mb-0 fw-600 opacity-50 ms-1">Characters</p>
        <i
          className="bi bi-plus-square-fill cp-text-blue cp-pointer"
          role="button"
          onClick={() => {
            console.log("Opening modal for new character");
            setEditingCharacter(null);
            setIsEditing(false);
            setModalOpen(true);
          }}
        ></i>
      </div>

      <div className="d-flex flex-wrap gap-2">
        {characters.map((character) => (
          <div
            key={character.id || `temp-${Date.now()}`}
            className="cp-bg-darker px-3 py-2 cp-rounded-sm position-relative overflow-hidden"
          >
            <div className="position-relative z-front d-flex gap-2 align-items-center">
              <i className="bi bi-person-fill cp-text-blue opacity-50"></i>
              <span className="cp-text-color fw-600 fs-14 me-3">{character.name}</span>
              <i
                className="bi bi-pencil-fill text-white opacity-50 fs-14 cp-pointer"
                onClick={() => {
                  console.log("Editing character:", JSON.stringify(character, null, 2));
                  setEditingCharacter(character);
                  setIsEditing(true);
                  setModalOpen(true);
                }}
              ></i>
            </div>
            <div className="cp-chip z-back"></div>
          </div>
        ))}
      </div>

      <CharacterModal
        show={modalOpen}
        onClose={() => {
          console.log("Closing character modal");
          setModalOpen(false);
          setEditingCharacter(null);
          setIsEditing(false);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
        initialData={editingCharacter}
        isEditing={isEditing}
      />
    </div>
  );
}