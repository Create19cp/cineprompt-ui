import React, { useState } from "react";
import Select from "react-select";
import { useProject } from "../../context/ProjectContext";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import { useScriptSave } from "../../context/ScriptSaveContext";
import './MainbarNav.css';

export default function MainbarNav() {
  const { projects, currentProject, createProject, selectProject, deleteProject } = useProject();
  const { triggerToast } = useToast();
  const { confirm } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const { saveFunction } = useScriptSave();

  const handleChange = (selected) => {
    if (selected.value === "new") {
      setShowForm(true);
    } else {
      selectProject(selected.value);
    }
  };

  const handleCreate = () => {
    if (!newProject.name.trim()) return;
    createProject(newProject.name.trim(), newProject.description.trim());
    setNewProject({ name: "", description: "" });
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (!currentProject) return;
  
    const confirmed = await confirm(`"${currentProject.name}"?`);
    if (confirmed) {
      deleteProject(currentProject.id);
      triggerToast(`${currentProject.name} deleted!`, "success");
    }
  };

  const handleClick = () => {
    if (saveFunction) {
      console.log("CALLING SAVE FUNCTION"); // debug log
      saveFunction(); // 💾 This should call handleManualSave from ScriptPanel
    } else {
      console.warn("Save function not set!");
    }
  };
  
  const options = [
    ...projects.map((p) => ({ value: p.id, label: p.name })),
    { value: "new", label: "Create New Project" }
  ];

  const selectedOption = currentProject
    ? { value: currentProject.id, label: currentProject.name }
    : null;

  return (
    <div id="cp-mainnav" className="p-3 cp-rounded cp-bg-dark col-12 mb-4">
      <div className="row g-4 align-items-center">
        <div className="col-lg-4">
          <div className="cp-bg-darker cp-text-grey cp-rounded-sm d-flex justify-content-between align-items-center">
            <div className="w-100">
              <Select
                options={options}
                value={selectedOption}
                onChange={handleChange}
                placeholder="Create or Select Project"
                classNamePrefix="cp-select"
                className="cp-select-container"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#fff",
                    boxShadow: "none",
                    minHeight: "unset",
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: "#fff",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "#aaa",
                  }),
                  dropdownIndicator: (base) => ({
                    ...base,
                    padding: 0,
                  }),
                }}
                formatOptionLabel={(option) => (
                  <div className="d-flex align-items-center">
                    {option.value === "new" && (
                      <i className="bi bi-plus-lg cp-text-green me-2"></i>
                    )}
                    <span>{option.label}</span>
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        <div className="col">
          <div className="d-flex gap-2 justify-content-end">
          <button onClick={handleClick} className="btn cp-btn-dark">
            <i className="bi bi-floppy cp-text-green me-2"></i> Save
          </button>
            <a
              href="#0"
              className={`btn cp-btn-dark cp-red ${!currentProject ? 'd-none' : ''}`}
              onClick={handleDelete}
            >
              <i className="bi bi-trash cp-text-red me-2"></i> Delete
            </a>
          </div>
        </div>
      </div>

      {/* Project Modal */}
      <div className={`modal fade ${showForm ? 'show d-block' : ''}`} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered cp-modal-fade">
          <div className="modal-content cp-bg-dark text-white cp-rounded overflow-hidden border-0">
            
            <div className="modal-header border-0 cp-bg-dark px-4 d-flex justify-content-between cp-bg-purple">
              <h6 className="modal-title">Create New Project</h6>
              <div className="cp-pointer" onClick={() => setShowForm(false)}><i class="bi bi-x-lg opacity-75"></i></div>
            </div>

            <div className="modal-body p-4">
             
              <input
                type="text"
                className="form-control mb-3"
                placeholder="Project Name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
              
              <textarea
                className="form-control mb-4"
                placeholder="Project Description"
                rows={4}
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              ></textarea>

              <div className="d-flex gap-2 justify-content-end">
                <button className="btn cp-btn-dark" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button className="btn cp-btn-green" onClick={handleCreate}>
                  Create
                </button>
              </div>
            
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
