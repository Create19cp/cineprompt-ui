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
      // Create project
      const response = await fetch('http://localhost:3001/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
      });
      if (!response.ok) throw new Error('Failed to create project');
      let newProject = await response.json();
      console.log('Created project:', JSON.stringify(newProject, null, 2));

      // Check if script exists; if not, set a temporary script and save
      if (!newProject.script?.id) {
        console.log('No script found, setting temporary script and saving');
        newProject = {
          ...newProject,
          script: {
            id: `temp-${newProject.id}`,
            content: '',
            wordCount: 0,
            projectId: newProject.id,
          },
        };

        // Save project with default script
        console.log('Saving project with default script');
        const updatedProject = await updateProject({
          script: {
            content: '',
            wordCount: 0,
          },
        }, newProject);
        if (updatedProject) {
          newProject = updatedProject;
        }

        // Retry fetching project to get backend script (up to 5 attempts, 2s delay)
        let attempts = 5;
        while (attempts > 0 && newProject.script?.id?.toString().startsWith('temp-')) {
          try {
            console.log(`Retrying fetch for project ${newProject.id}, attempt ${6 - attempts}`);
            const retryResponse = await fetch(`http://localhost:3001/api/projects/${newProject.id}`);
            if (!retryResponse.ok) throw new Error('Failed to fetch project');
            const retryProject = await retryResponse.json();
            console.log('Retried project:', JSON.stringify(retryProject, null, 2));
            if (retryProject.script?.id) {
              newProject = retryProject;
              break;
            }
            attempts--;
            if (attempts > 0) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          } catch (retryError) {
            console.error('Retry fetch error:', retryError.message);
            attempts--;
            if (attempts > 0) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          }
        }

        if (newProject.script?.id?.toString().startsWith('temp-')) {
          console.warn('No backend script created, using temporary script ID');
        }
      }

      setProjects((prev) => [...prev, newProject]);
      setCurrentProject(newProject);
      localStorage.setItem('lastActiveProjectId', newProject.id.toString());
      console.log('Project created and saved:', JSON.stringify(newProject, null, 2));
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error.message, error.stack);
      throw error;
    }
  };

  const updateProject = async (updatedFields, overrideProject = null) => {
    const projectToUpdate = overrideProject || currentProject;
    if (!projectToUpdate) {
      console.error('No current project to update');
      return;
    }

    try {
      console.log('updateProject received fields:', JSON.stringify(updatedFields, null, 2));

      // Process characters
      const characters = updatedFields.characters
        ? updatedFields.characters.map((char) => ({
            id: char.id || null,
            name: char.name,
            description: char.description || null,
            color: char.color || '#55af65',
            projectId: projectToUpdate.id,
            voiceId: char.voiceId || null,
          }))
        : projectToUpdate.characters || [];

      console.log('Processed characters:', JSON.stringify(characters, null, 2));

      // Create character map for dialogue lookup
      const characterMap = new Map(characters.map((c) => [c.name.toLowerCase(), c.id]));
      console.log('Character map:', Array.from(characterMap.entries()));

      // Check if script exists; use temporary if missing
      let scriptId = projectToUpdate.script?.id;
      if (!scriptId && updatedFields.scenes?.length > 0) {
        console.log('No script ID found, using temporary script ID');
        scriptId = `temp-${projectToUpdate.id}`;
        setCurrentProject((prev) => ({
          ...prev,
          script: {
            id: scriptId,
            content: '',
            wordCount: 0,
            projectId: projectToUpdate.id,
          },
        }));
      }

      // Process scenes
      const scenes = updatedFields.scenes
        ? updatedFields.scenes.map((scene) => ({
            id: scene.id || null,
            name: scene.name,
            description: scene.description || null,
            scriptId: scriptId || projectToUpdate.script?.id,
            dialogues: Array.isArray(scene.dialogues)
              ? scene.dialogues.map((d, dIndex) => {
                  const characterId = d.characterId || characterMap.get(d.characterName?.toLowerCase());
                  if (!d.content) {
                    console.warn('Invalid dialogue (missing content) in scene:', scene.name, JSON.stringify(d, null, 2));
                    return null;
                  }
                  if (!characterId && !characterMap.has(d.characterName?.toLowerCase())) {
                    console.warn('No character found for dialogue:', d.characterName, JSON.stringify(d, null, 2));
                  }
                  return {
                    id: d.id || null,
                    content: d.content || d.line || '',
                    characterId: characterId || null,
                    orderIndex: d.orderIndex || dIndex,
                  };
                }).filter((d) => d !== null)
              : [],
          }))
        : projectToUpdate.script?.scenes || [];

      console.log('Processed scenes:', JSON.stringify(scenes, null, 2));

      const mergedData = {
        id: projectToUpdate.id,
        name: updatedFields.name || projectToUpdate.name,
        genres: Array.isArray(updatedFields.genres)
          ? updatedFields.genres
          : projectToUpdate.genres || [],
        tones: Array.isArray(updatedFields.tones)
          ? updatedFields.tones
          : projectToUpdate.tones || [],
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
              content: projectToUpdate.script?.content || '',
              wordCount: projectToUpdate.script?.wordCount || 0,
            },
      };

      if (mergedData.scenes.some((scene) => !scene.scriptId)) {
        console.warn('Missing scriptId in scenes, using temporary:', JSON.stringify(mergedData.scenes, null, 2));
        mergedData.scenes = mergedData.scenes.map((scene) => ({
          ...scene,
          scriptId: scriptId || `temp-${projectToUpdate.id}`,
        }));
      }

      console.log('Sending update data to backend:', JSON.stringify(mergedData, null, 2));
      const response = await fetch(`http://localhost:3001/api/projects/${projectToUpdate.id}`, {
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

      // Replace temporary script ID with backend ID
      if (updatedProject.script?.id && projectToUpdate.script?.id?.toString().startsWith('temp-')) {
        console.log('Replacing temporary script ID with backend ID:', updatedProject.script.id);
        setCurrentProject(updatedProject);
      }

      // Check for issues
      if (updatedProject.characters.length === 0 && updatedFields.characters?.length > 0) {
        console.warn('Characters not saved in backend response:', JSON.stringify(updatedFields.characters, null, 2));
      }
      if (updatedProject.script?.scenes.some((s) => s.dialogues?.length === 0) && updatedFields.scenes?.some((s) => s.dialogues?.length > 0)) {
        console.warn('Dialogues missing in backend response:', JSON.stringify(updatedProject.script?.scenes, null, 2));
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
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
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
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