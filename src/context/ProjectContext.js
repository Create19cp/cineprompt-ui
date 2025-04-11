import React, { createContext, useState, useContext, useEffect } from "react";

const ProjectContext = createContext();

export function useProject() {
  return useContext(ProjectContext);
}

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem("cineprompt-projects");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentProject, setCurrentProject] = useState(() => {
    const saved = localStorage.getItem("cineprompt-current-project");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem("cineprompt-projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("cineprompt-current-project", JSON.stringify(currentProject));
  }, [currentProject]);

  const createProject = (name, description) => {
    const newProject = {
      id: Date.now(),
      name,
      description,
    };
    setProjects((prev) => [...prev, newProject]);
    setCurrentProject(newProject);
  };

  const updateProject = (updatedFields) => {
    if (!currentProject) return;
  
    const updatedProject = {
      ...currentProject,
      ...updatedFields,
    };
  
    const updatedProjects = projects.map((p) =>
      p.id === currentProject.id ? updatedProject : p
    );
  
    setProjects(updatedProjects);
    setCurrentProject(updatedProject);
  };
  

  const selectProject = (projectId) => {
    const selected = projects.find((p) => p.id === parseInt(projectId));
    if (selected) setCurrentProject(selected);
  };

  const deleteProject = (projectId) => {
    const updated = projects.filter((p) => p.id !== projectId);
    setProjects(updated);
    if (currentProject && currentProject.id === projectId) {
      setCurrentProject(null);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        createProject,
        selectProject,
        deleteProject,
        updateProject, 
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
