import React, { useState } from "react";
import SceneModal from "./SceneModal";
import { useProject } from "../../context/ProjectContext";

export default function SceneList({ scenes, setScenes, characters }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingScene, setEditingScene] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const { currentProject, updateProject } = useProject();

  const handleSave = async (scene) => {
    try {
      if (!scene.name || !scene.name.trim()) {
        alert("Scene name is required");
        return;
      }

      if (!currentProject?.script?.id) {
        alert("No script associated with the project. Please create a project first.");
        return;
      }

      const characterMap = new Map(characters.map(c => [c.name.toLowerCase(), c.id]));
      console.log("Character map:", Array.from(characterMap.entries()));
      console.log("Incoming scene dialogues:", JSON.stringify(scene.dialogues, null, 2));

      // Process incoming dialogues, preserving orderIndex
      const incomingDialogues = Array.isArray(scene.dialogues)
        ? scene.dialogues
            .sort((a, b) => a.orderIndex - b.orderIndex) // Sort by orderIndex
            .map((d, index) => {
              const characterId = characterMap.get(d.characterName?.toLowerCase());
              if (!characterId) {
                console.warn(`Character not found: ${d.characterName}`);
                return null;
              }
              return {
                id: d.id && typeof d.id === 'string' && d.id.startsWith('temp-') ? null : d.id,
                content: d.content || d.line || "",
                characterId,
                orderIndex: d.orderIndex ?? index, // Preserve modal's orderIndex
              };
            })
            .filter(d => d !== null)
        : [];

      const sceneData = {
        id: typeof scene.id === 'string' && scene.id.startsWith('temp-') ? null : scene.id,
        name: scene.name.trim(),
        description: scene.description || null,
        orderIndex: scene.orderIndex || scenes.length,
        scriptId: currentProject.script.id,
        dialogues: incomingDialogues,
      };

      console.log("Saving scene:", JSON.stringify(sceneData, null, 2));

      setScenes((prev) => {
        const exists = prev.find((s) => s.id === sceneData.id);
        const updated = exists
          ? prev.map((s) => (s.id === sceneData.id ? sceneData : s))
          : [...prev, sceneData];

        console.log("Updated local scenes:", JSON.stringify(updated, null, 2));

        updateProject({ scenes: updated })
          .then((response) => {
            console.log("updateProject response:", JSON.stringify(response, null, 2));
          })
          .catch((error) => {
            console.error("Failed to update project:", error);
            alert(`Failed to save scene: ${error.message}`);
          });

        return updated;
      });

      setModalOpen(false);
      setEditingScene(null);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving scene:", error);
      alert(`Failed to save scene: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      console.log("Deleting scene with id:", id);
      setScenes((prev) => {
        const updated = prev.filter((s) => s.id !== id);
        updateProject({ scenes: updated })
          .catch((error) => {
            console.error("Failed to update project:", error);
            alert(`Failed to delete scene: ${error.message}`);
          });
        return updated;
      });
      setModalOpen(false);
      setEditingScene(null);
      setIsEditing(false);
    } catch (error) {
      console.error("Error deleting scene:", error);
      alert(`Error deleting scene: ${error.message}`);
    }
  };

  return (
    <div id="cp-script-scenes">
      <div className="d-flex align-items-center mb-2 gap-2">
        <p className="mb-0 fw-600 opacity-50 ms-1">Scenes</p>
        <i
          className="bi bi-plus-square-fill cp-text-blue cp-pointer"
          role="button"
          onClick={() => {
            if (!currentProject?.script?.id) {
              alert("No script associated with the project. Please create a project first.");
              return;
            }
            setEditingScene(null);
            setIsEditing(false);
            setModalOpen(true);
          }}
        ></i>
      </div>

      <div className="d-flex flex-wrap gap-2">
        {scenes.map((scene) => (
          <div
            key={scene.id || `temp-${Date.now()}`}
            className="cp-bg-darker px-3 py-2 cp-rounded-sm position-relative overflow-hidden"
          >
            <div className="position-relative z-front d-flex gap-2 align-items-center">
              <i className="bi bi-image-fill cp-text-blue opacity-50"></i>
              <span className="cp-text-color fw-600 fs-14 me-3">{scene.name}</span>
              <i
                className="bi bi-pencil-fill text-white opacity-50 fs-14 cp-pointer"
                onClick={() => {
                  setEditingScene(scene);
                  setIsEditing(true);
                  setModalOpen(true);
                }}
              ></i>
            </div>
            <div className="cp-chip z-back"></div>
          </div>
        ))}
      </div>

      <SceneModal
        show={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingScene(null);
          setIsEditing(false);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
        initialData={editingScene}
        characters={characters}
        isEditing={isEditing}
      />
    </div>
  );
}