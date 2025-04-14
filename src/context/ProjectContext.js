import React, { createContext, useState, useContext, useEffect } from 'react';

const ProjectContext = createContext();

export function useProject() {
  return useContext(ProjectContext);
}

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lastProjectId = localStorage.getItem('lastActiveProjectId');
    if (lastProjectId) {
      selectProject(parseInt(lastProjectId));
    }
    fetchProjects();
  }, []);

  useEffect(() => {
    if (currentProject?.id) {
      localStorage.setItem('lastActiveProjectId', currentProject.id.toString());
    }
  }, [currentProject]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      console.log('Fetched projects:', JSON.stringify(data, null, 2));
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (name, description) => {
    try {
      const response = await fetch('http://localhost:3001/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
      });
      if (!response.ok) throw new Error('Failed to create project');
      const newProject = await response.json();
      console.log('Created project:', JSON.stringify(newProject, null, 2));
      setProjects(prev => [...prev, newProject]);
      setCurrentProject(newProject);
      localStorage.setItem('lastActiveProjectId', newProject.id.toString());
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const updateProject = async (updatedFields) => {
    if (!currentProject) {
      console.error('No current project to update');
      return;
    }

    try {
      const characters = updatedFields.characters
        ? updatedFields.characters.map(char => ({
            id: char.id || null,
            name: char.name,
            description: char.description || null,
            color: char.color || '#000000',
            projectId: currentProject.id,
          }))
        : currentProject.characters || [];

      const scenes = updatedFields.scenes
        ? updatedFields.scenes.map(scene => ({
            id: scene.id || null,
            name: scene.name,
            description: scene.description || null,
            scriptId: currentProject.script?.id,
            dialogues: Array.isArray(scene.dialogues)
              ? scene.dialogues.map((d, dIndex) => ({
                  id: d.id || null,
                  content: d.content || d.line || "",
                  characterId: d.characterId,
                  orderIndex: d.orderIndex || dIndex,
                }))
              : [],
          }))
        : currentProject.script?.scenes || [];

      const mergedData = {
        id: currentProject.id,
        name: updatedFields.name || currentProject.name,
        genres: Array.isArray(updatedFields.genres)
          ? updatedFields.genres
          : currentProject.genres || [],
        tones: Array.isArray(updatedFields.tones)
          ? updatedFields.tones
          : currentProject.tones || [],
        characters,
        scenes,
        script: updatedFields.script
          ? {
              content: updatedFields.script.content || '',
              wordCount: Number.isInteger(updatedFields.script.wordCount)
                ? updatedFields.script.wordCount
                : 0,
            }
          : {
              content: currentProject.script?.content || '',
              wordCount: currentProject.script?.wordCount || 0,
            },
      };

      if (!currentProject.script?.id) {
        console.error('No script ID available for project:', JSON.stringify(currentProject, null, 2));
        throw new Error('Cannot save without a script');
      }

      if (mergedData.scenes.some(scene => !scene.scriptId)) {
        console.error('Missing scriptId in scenes:', JSON.stringify(mergedData.scenes, null, 2));
        throw new Error('All scenes must have a scriptId');
      }

      console.log('Sending update data:', JSON.stringify(mergedData, null, 2));
      const response = await fetch(`http://localhost:3001/api/projects/${currentProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mergedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Update project failed with status:', response.status, 'Error data:', errorData);
        throw new Error(errorData.error || `Failed to update project (status ${response.status})`);
      }

      const updatedProject = await response.json();
      console.log('Received updated project:', JSON.stringify(updatedProject, null, 2));

      setProjects(prev =>
        prev.map(p => (p.id === updatedProject.id ? updatedProject : p))
      );
      setCurrentProject(updatedProject);
      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error.message, error.stack);
      throw error;
    }
  };

  const selectProject = async (projectId) => {
    try {
      console.log(`Fetching project with ID: ${projectId}`);
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch project');
      }
      const project = await response.json();
      console.log('Selected project:', JSON.stringify(project, null, 2));
      setCurrentProject(project);
      localStorage.setItem('lastActiveProjectId', projectId.toString());
    } catch (error) {
      console.error('Error selecting project:', error.message);
      setCurrentProject(null);
      localStorage.removeItem('lastActiveProjectId');
      throw error;
    }
  };

  const deleteProject = async (projectId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete project');
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (currentProject && currentProject.id === projectId) {
        setCurrentProject(null);
        localStorage.removeItem('lastActiveProjectId');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        loading,
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