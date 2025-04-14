import React, { useState } from "react";
import { useProject } from "../context/ProjectContext";
import { useToast } from "../context/ToastContext";

export default function NewProjectModal({ show, onClose }) {
  const [title, setTitle] = useState("");
  const { createProject } = useProject();
  const { triggerToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      triggerToast("Please enter a project title", "error");
      return;
    }

    try {
      await createProject(title);
      triggerToast("Project created successfully!", "success");
      onClose();
    } catch (error) {
      triggerToast("Failed to create project", "error");
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content cp-bg-dark text-white">
          <div className="modal-header border-0">
            <h5 className="modal-title">Create New Project</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="projectTitle" className="form-label">
                  Project Title
                </label>
                <input
                  type="text"
                  className="form-control cp-bg-darker text-white border-0"
                  id="projectTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn cp-btn-dark"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button type="submit" className="btn cp-btn-dark cp-green">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 