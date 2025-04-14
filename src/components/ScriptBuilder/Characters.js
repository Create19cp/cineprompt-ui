import React, { useState } from 'react';
import CharacterModal from './CharacterModal';
import { useProject } from '../../context/ProjectContext';
import { debounce } from 'lodash';

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
  
      const characterData = {
        id: character.id || null,
        name: character.name.trim(),
        description: character.description?.trim() || null,
        color: character.color || '#000000',
        projectId: currentProject.id,
      };
  
      console.log('Saving character:', characterData);
  
      setCharacters((prev) => {
        const exists = prev.find((c) => c.id === characterData.id);
        const updated = exists
          ? prev.map((c) => (c.id === characterData.id ? characterData : c))
          : [...prev, characterData];
  
        console.log('Local characters updated:', updated);
  
        // Update project in backend
        updateProject({ characters: updated })
          .then((response) => {
            console.log('updateProject response:', response);
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
        console.log('Updated characters after delete:', updated);

        updateProject({
          ...currentProject,
          characters: updated,
        }).catch((error) => {
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
            setEditingCharacter(null);
            setModalOpen(true);
          }}
        ></i>
      </div>

      <div className="d-flex flex-wrap gap-2">
        {characters.map((char) => (
          <div
            key={char.id || `temp-${Date.now()}`} // Fallback key for safety
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