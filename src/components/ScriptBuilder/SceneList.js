import React, { useState } from "react";
import SceneModal from "./SceneModal";
import { useProject } from "../../context/ProjectContext";

export default function SceneList({ scenes, setScenes, characters }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingScene, setEditingScene] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const { updateProject } = useProject();

  const handleSave = (scene) => {
    setScenes((prev) => {
      const exists = prev.find((s) => s.id === scene.id);
      const updated = exists
        ? prev.map((s) => (s.id === scene.id ? scene : s))
        : [...prev, scene];

      updateProject({ scenes: updated });
      return updated;
    });

    setModalOpen(false);
    setEditingScene(null);
    setIsEditing(false);
  };

  const handleDelete = (id) => {
    setScenes((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      updateProject({ scenes: updated });
      return updated;
    });

    setModalOpen(false);
    setEditingScene(null);
    setIsEditing(false);
  };

  return (
    <div id="cp-script-scenes">
      <div className="d-flex align-items-center mb-2 gap-2">
        <p className="mb-0 fw-600 opacity-50 ms-1">Scenes</p>
        <i
          className="bi bi-plus-square-fill cp-text-blue cp-pointer"
          role="button"
          onClick={() => {
            const newScene = {
              id: Date.now(),
              name: `Scene ${scenes.length + 1}`,
              description: "",
              dialogues: [],
            };
            setScenes((prev) => [...prev, newScene]);
            setEditingScene(newScene);
            setIsEditing(false); // ✅ mark as new
            setModalOpen(true);
          }}
        ></i>
      </div>

      <div className="d-flex flex-wrap gap-2">
        {scenes.map((scene) => (
          <div
            key={scene.id}
            className="cp-bg-darker px-3 py-2 cp-rounded-sm position-relative overflow-hidden"
          >
            <div className="position-relative z-front d-flex gap-2 align-items-center">
              <i className="bi bi-image-fill cp-text-blue opacity-50"></i>
              <span className="cp-text-color fw-600 fs-14 me-3">{scene.name}</span>
              <i
                className="bi bi-pencil-fill text-white opacity-50 fs-14 cp-pointer"
                onClick={() => {
                  setEditingScene(scene);
                  setIsEditing(true); // ✅ mark as editing
                  setModalOpen(true);
                }}
              ></i>
            </div>
            <div className="cp-chip z-back"></div>
          </div>
        ))}
      </div>

      {/* 🎬 Scene Modal (with dialogues) */}
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
