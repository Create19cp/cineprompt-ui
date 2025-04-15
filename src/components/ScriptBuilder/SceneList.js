import React, { useState, useCallback } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SceneModal from "./SceneModal";
import { useProject } from "../../context/ProjectContext";

// Simple debounce function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

function SortableScene({ scene, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: scene.id?.toString(),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div id="cp-scene-list" className="d-flex align-items-center gap-0">
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="cp-bg-darker px-3 py-2 cp-rounded-start-sm position-relative overflow-hidden flex-grow-1"
      >
        <div className="position-relative z-front d-flex gap-2 align-items-center">
          <i className="bi bi-image-fill cp-text-blue opacity-50"></i>
          <span className="cp-text-color fw-600 fs-14">{scene.name}</span>
        </div>
      </div>
      <i
        className="bi bi-pencil-fill text-white fs-14 cp-pointer opacity-50"
        onClick={(e) => {
          e.preventDefault();
          console.log("Edit clicked for scene:", JSON.stringify(scene, null, 2));
          onEdit(scene);
        }}
      ></i>
    </div>
  );
}

export default function SceneList({ scenes, setScenes, characters }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingScene, setEditingScene] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { currentProject, updateProject } = useProject();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSave = useCallback(debounce(async (scene) => {
    if (isSaving) {
      console.log("Save in progress, skipping:", scene.name);
      return;
    }
    setIsSaving(true);
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

      const incomingDialogues = Array.isArray(scene.dialogues)
        ? scene.dialogues
            .sort((a, b) => a.orderIndex - b.orderIndex)
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
                orderIndex: d.orderIndex ?? index,
              };
            })
            .filter(d => d !== null)
        : [];

      const tempId = `temp-${crypto.randomUUID()}`;
      const sceneData = {
        id: scene.id || tempId,
        name: scene.name.trim(),
        description: scene.description || null,
        scriptId: currentProject.script.id,
        dialogues: incomingDialogues,
      };

      console.log("Saving scene with tempId:", tempId, JSON.stringify(sceneData, null, 2));

      setScenes((prev) => {
        const isEditing = scene.id && prev.some(s => s.id === scene.id);
        let updated;
        if (isEditing) {
          updated = prev.map((s) => (s.id === scene.id ? { ...sceneData, id: scene.id } : s));
        } else {
          // Deduplicate by name and tempId to prevent accidental duplicates
          const existingNames = new Set(prev.map(s => s.name));
          if (existingNames.has(sceneData.name)) {
            console.warn(`Scene with name ${sceneData.name} already exists, checking IDs`);
            updated = prev.filter(s => s.id !== tempId).concat(sceneData);
          } else {
            updated = [...prev, sceneData];
          }
        }

        console.log("Updated local scenes:", JSON.stringify(updated, null, 2));

        const scenesToSave = updated.map(s => ({
          id: typeof s.id === 'string' && s.id.startsWith('temp-') ? null : s.id,
          name: s.name,
          description: s.description || null,
          scriptId: currentProject.script.id,
          dialogues: Array.isArray(s.dialogues)
            ? s.dialogues.map(d => ({
                id: d.id && !d.id.toString().startsWith('temp-') ? d.id : null,
                content: d.content,
                characterId: d.characterId,
                orderIndex: d.orderIndex,
              }))
            : [],
        }));

        console.log("Sending scenes to backend:", JSON.stringify(scenesToSave, null, 2));

        updateProject({ scenes: scenesToSave })
          .then((response) => {
            console.log("updateProject response:", JSON.stringify(response, null, 2));
            setScenes((prevScenes) => {
              const backendScenes = response.script.scenes || prevScenes;
              // Map temp IDs to backend IDs
              const updatedScenes = prevScenes.map(ps => {
                const matchingBackendScene = backendScenes.find(bs => 
                  bs.name === ps.name && 
                  bs.description === ps.description &&
                  bs.dialogues.length === ps.dialogues.length
                );
                return matchingBackendScene ? { ...ps, id: matchingBackendScene.id } : ps;
              });
              console.log("Final scenes with backend IDs:", JSON.stringify(updatedScenes, null, 2));
              return updatedScenes;
            });
          })
          .catch((error) => {
            console.error("Failed to update project:", error);
            alert(`Failed to save scene: ${error.message}`);
          });

        return updated;
      });

      setModalOpen(false);
      setEditingScene(null);
    } catch (error) {
      console.error("Error saving scene:", error);
      alert(`Failed to save scene: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }, 500), [currentProject, updateProject, characters, isSaving]);

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
    } catch (error) {
      console.error("Error deleting scene:", error);
      alert(`Error deleting scene: ${error.message}`);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      console.log("No drag change:", { active, over });
      return;
    }

    try {
      setScenes((prev) => {
        const activeIndex = prev.findIndex((s) => (s.id ? s.id.toString() : `temp-${s.name}-${crypto.randomUUID()}`) === active.id);
        const overIndex = prev.findIndex((s) => (s.id ? s.id.toString() : `temp-${s.name}-${crypto.randomUUID()}`) === over.id);

        if (activeIndex === -1 || overIndex === -1) {
          console.warn("Invalid drag indices:", { activeIndex, overIndex });
          return prev;
        }

        const reorderedScenes = arrayMove(prev, activeIndex, overIndex);
        console.log("Reordered scenes:", JSON.stringify(reorderedScenes, null, 2));

        const scenesToSave = reorderedScenes.map(scene => ({
          id: typeof scene.id === 'string' && scene.id.startsWith('temp-') ? null : scene.id,
          name: scene.name,
          description: scene.description || null,
          scriptId: currentProject.script.id,
          dialogues: Array.isArray(scene.dialogues)
            ? scene.dialogues.map(d => ({
                id: d.id && !d.id.toString().startsWith('temp-') ? d.id : null,
                content: d.content,
                characterId: d.characterId,
                orderIndex: d.orderIndex,
              }))
            : [],
        }));

        console.log("Saving scenes order:", JSON.stringify(scenesToSave, null, 2));

        let attempts = 3;
        const saveOrder = async () => {
          while (attempts > 0) {
            try {
              const response = await updateProject({ scenes: scenesToSave });
              console.log("Scene order saved:", JSON.stringify(response, null, 2));
              return response;
            } catch (error) {
              attempts--;
              console.warn(`Save attempt failed, ${attempts} left:`, error.message);
              if (attempts === 0) throw error;
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        };

        saveOrder().catch((error) => {
          console.error("Failed to save scene order after retries:", error);
          alert(`Failed to save scene order: ${error.message}`);
        });

        return reorderedScenes;
      });
    } catch (error) {
      console.error("Drag end error:", error);
      alert(`Failed to reorder scenes: ${error.message}`);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
              console.log("Opening modal for new scene");
              setEditingScene(null);
              setModalOpen(true);
            }}
          ></i>
        </div>

        <SortableContext items={scenes.map(scene => scene.id?.toString() || `temp-${scene.name}-${crypto.randomUUID()}`)}>
          <div className="d-flex flex-wrap gap-2">
            {scenes.map((scene) => (
              <SortableScene
                key={scene.id || `temp-${scene.name}-${crypto.randomUUID()}`}
                scene={scene}
                onEdit={(scene) => {
                  console.log("Setting editing scene:", JSON.stringify(scene, null, 2));
                  setEditingScene(scene);
                  setModalOpen(true);
                }}
              />
            ))}
          </div>
        </SortableContext>

        <SceneModal
          show={modalOpen}
          onClose={() => {
            console.log("Closing scene modal, editingScene:", editingScene);
            setModalOpen(false);
            setEditingScene(null);
          }}
          onSave={handleSave}
          onDelete={handleDelete}
          initialData={editingScene}
          characters={characters}
        />
      </div>
    </DndContext>
  );
}