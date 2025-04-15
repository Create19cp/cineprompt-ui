import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';

export default function ProjectNameEditor() {
  const { currentProject, updateProject } = useProject();
  const { triggerToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(currentProject?.name || '');

  const handleNameChange = (e) => {
    setNewName(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      triggerToast('Project name cannot be empty', 'error');
      return;
    }

    try {
      await updateProject({ name: newName });
      setIsEditing(false);
      triggerToast('Project name updated successfully', 'success');
    } catch (error) {
      console.error('Error updating project name:', error);
      triggerToast('Failed to update project name', 'error');
    }
  };

  if (!currentProject) return null;

  return (
    <div className="project-name-editor">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="d-flex align-items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={handleNameChange}
            className="form-control cp-rounded-sm"
            autoFocus
          />
          <button type="submit" className="btn cp-btn-dark cp-green btn-sm">
            Save
          </button>
          <button
            type="button"
            className="btn cp-btn-dark cp-red btn-sm"
            onClick={() => {
              setIsEditing(false);
              setNewName(currentProject.name);
            }}
          >
            Cancel
          </button>
        </form>
      ) : (
        <div className="d-flex align-items-center gap-2">
          <h4 className="mb-0 ps-2 opacity-75">{currentProject.name}</h4>
          <button
            className="bg-transparent border-0 cp-text-green"
            onClick={() => setIsEditing(true)}
          >
            <i className="bi bi-pencil"></i>
          </button>
        </div>
      )}
        <div className="cp-divider my-3"></div>
    </div>

  );
} 