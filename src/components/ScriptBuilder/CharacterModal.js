import React, { useState, useEffect } from "react";

export default function CharacterModal({ show, onClose, onSave, onDelete, initialData }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
    } else {
      setName("");
      setDescription("");
    }
  }, [initialData]);

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content cp-bg-dark text-white cp-rounded-sm border-0">
        <div class="modal-header border-0 cp-bg-purple px-4 d-flex justify-content-between">
            <h6 className="modal-title">
              {initialData ? "Edit Character" : "Add Character"}
            </h6>
            <div class="cp-pointer" onClick={onClose}><i class="bi bi-x-lg opacity-75"></i></div>
          </div>
          <div className="modal-body p-4">
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Character Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <textarea
              className="form-control"
              placeholder="Character Description"
              value={description}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
          <div className="modal-footer border-0 px-4 pt-0 pb-4">
            {initialData && (
              <button
                className="btn cp-btn-dark me-auto cp-red"
                onClick={() => onDelete(initialData.id)}
              >
              <i class="bi bi-trash cp-text-red me-2"></i>  Delete
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
                })
              }
              disabled={!name.trim()}
            >
              {initialData ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
