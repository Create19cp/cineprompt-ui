import React, { useState } from 'react';
import CharacterModal from './CharacterModal';
import { useProject } from '../../context/ProjectContext';

export default function Characters({ characters, setCharacters }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(null);

  const { currentProject, updateProject } = useProject();

  const handleSave = async (character) => {
    try {
      if (!character.name || !character.name.trim()) {
        alert('Character name is required');
        return;
      }

      const tempId = character.id || `temp-${crypto.randomUUID()}`;
      const characterData = {
        id: tempId,
        name: character.name.trim(),
        description: character.description?.trim() || null,
        color: character.color || '#55af65',
        projectId: currentProject.id,
      };

      console.log('Saving character with tempId:', tempId, JSON.stringify(characterData, null, 2));

      setCharacters((prev) => {
        const isEditing = character.id && prev.some(c => c.id === character.id);
        let updated;
        if (isEditing) {
          updated = prev.map((c) => (c.id === character.id ? { ...characterData, id: character.id } : c));
        } else {
          updated = [...prev, characterData];
        }

        console.log('Local characters updated:', JSON.stringify(updated, null, 2));

        const charactersToSave = updated.map(c => ({
          id: typeof c.id === 'string' && c.id.startsWith('temp-') ? null : c.id,
          name: c.name,
          description: c.description || null,
          color: c.color,
          projectId: currentProject.id,
        }));

        console.log('Sending characters to backend:', JSON.stringify(charactersToSave, null, 2));

        updateProject({ characters: charactersToSave })
          .then((response) => {
            console.log('updateProject response:', JSON.stringify(response, null, 2));
            setCharacters((prevChars) => {
              const backendCharacters = response.characters || prevChars;
              const updatedChars = prevChars.map(pc => {
                const matchingBackendChar = backendCharacters.find(bc =>
                  bc.name === pc.name &&
                  bc.description === pc.description &&
                  bc.color === pc.color
                );
                return matchingBackendChar ? { ...pc, id: matchingBackendChar.id } : pc;
              });
              console.log('Final characters with backend IDs:', JSON.stringify(updatedChars, null, 2));
              return updatedChars;
            });
          })
          .catch((error) => {
            console.error('Failed to update project:', error);
            alert(`Failed to save character: ${error.message}`);
          });

        return updated;
      });

      setModalOpen(false);
      setEditingCharacter(null);
    } catch (error) {
      console.error('Error saving character:', error);
      alert(`Error saving character: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      console.log('Deleting character with id:', id);

      setCharacters((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        console.log('Updated characters after delete:', JSON.stringify(updated, null, 2));

        updateProject({ characters: updated })
          .catch((error) => {
            console.error('Failed to update project:', error);
            alert(`Failed to delete character: ${error.message}`);
          });

        return updated;
      });

      setModalOpen(false);
      setEditingCharacter(null);
    } catch (error) {
      console.error('Error deleting character:', error);
      alert(`Error deleting character: ${error.message}`);
    }
  };

  return (
    <div id="cp-script-characters">
      <div className="d-flex align-items-center mb-2 gap-2">
        <p className="mb-0 fw-600 opacity-50 ms-1">Characters</p>
        <i
          className="bi bi-plus-square-fill cp-text-green cp-pointer"
          role="button"
          onClick={() => {
            console.log("Opening modal for new character");
            setEditingCharacter(null);
            setModalOpen(true);
          }}
        ></i>
      </div>

      <div className="d-flex flex-wrap gap-2">
        {characters.map((char) => (
          <div
            key={char.id || `temp-${char.name}-${crypto.randomUUID()}`}
            className="cp-bg-darker px-3 py-2 cp-rounded-sm position-relative overflow-hidden"
          >
            <div className="position-relative z-front d-flex gap-2 align-items-center">
              <i className="bi bi-person-fill" style={{ color: char.color || '#55af65' }}></i>
              <span className="cp-text-color fw-600 fs-14 me-3">{char.name}</span>
              <div
                onClick={() => {
                  console.log("Editing character:", JSON.stringify(char, null, 2));
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
        onClose={() => {
          console.log("Closing character modal, editingCharacter:", editingCharacter);
          setModalOpen(false);
          setEditingCharacter(null);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
        initialData={editingCharacter}
      />
    </div>
  );
}