import React, { useState, useEffect, useCallback } from "react";
import { useProject } from "../../context/ProjectContext";
import { useToast } from "../../context/ToastContext";
import { useScriptSave } from "../../context/ScriptSaveContext";
import { generateScriptFromScenes, parseScriptToScenes, parseScriptToCharacters } from "../../utils/scriptHelpers";
import PromptInput from "../MainPrompt/PromptInput";
import ScriptEditor from "./ScriptEditor";
import SceneList from "./SceneList";
import GenreSelector from "./GenreSelector";
import ToneSelector from "./ToneSelector";
import Characters from "./Characters";
import ProjectNameEditor from "./ProjectNameEditor";

export default function ScriptPanel() {
  const { currentProject, updateProject, loading } = useProject();
  const { triggerToast } = useToast();
  const { setSaveFunction } = useScriptSave();
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedTones, setSelectedTones] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [script, setScript] = useState("");
  const [scenes, setScenes] = useState([]);
  const [lastProjectId, setLastProjectId] = useState(null);

  useEffect(() => {
    if (currentProject?.id !== lastProjectId) {
      console.log('Initializing state from currentProject:', currentProject);
      setScript(currentProject?.script?.content || "");
      setScenes(currentProject?.script?.scenes || []);
      setSelectedGenres(currentProject?.genres?.map(genre => ({ value: genre, label: genre })) || []);
      setSelectedTones(currentProject?.tones?.map(tone => ({ value: tone, label: tone })) || []);
      setCharacters(currentProject?.characters || []);
      setLastProjectId(currentProject?.id);
    }
  }, [currentProject, lastProjectId]);

  useEffect(() => {
    console.log('Scenes state updated:', scenes);
  }, [scenes]);

  const handleManualSave = useCallback(async () => {
    console.log("Starting manual save...");
    if (!currentProject) {
      console.warn("No current project, cannot save");
      return;
    }

    const genresToSave = selectedGenres.map(genre => genre.value);
    const tonesToSave = selectedTones.map(tone => tone.value);

    try {
      const updateData = {
        name: currentProject.name,
        genres: genresToSave,
        tones: tonesToSave,
        characters,
        scenes,
        script: { content: script, wordCount: script.trim().split(/\s+/).filter(Boolean).length },
      };

      console.log('Saving project data:', JSON.stringify(updateData, null, 2));
      const response = await updateProject(updateData);
      console.log('Manual save response:', JSON.stringify(response, null, 2));
      triggerToast("Script saved successfully!", "success");
    } catch (error) {
      console.error("Error saving project:", error);
      triggerToast("Failed to save script", "error");
    }
  }, [currentProject, script, selectedGenres, selectedTones, characters, scenes, updateProject, triggerToast]);

  useEffect(() => {
    setSaveFunction(() => handleManualSave);
  }, [handleManualSave, setSaveFunction]);

  useEffect(() => {
    if (script && currentProject?.script?.id) {
      const newScenes = parseScriptToScenes(script);
      const existingSceneNames = new Set(scenes.map(s => s.name));
      const scenesToAdd = newScenes.filter(scene => !existingSceneNames.has(scene.name));
      if (scenesToAdd.length > 0) {
        const newScenesWithScriptId = scenesToAdd.map(scene => ({
          ...scene,
          scriptId: currentProject.script.id,
          dialogues: [],
        }));
        setScenes(prev => [...prev, ...newScenesWithScriptId]);
      }

      const newCharacters = parseScriptToCharacters(script);
      const existingCharacterNames = new Set(characters.map(c => c.name));
      const charactersToAdd = newCharacters.filter(char => !existingCharacterNames.has(char.name));
      if (charactersToAdd.length > 0) {
        setCharacters(prev => [...prev, ...charactersToAdd]);
      }
    }
  }, [script, currentProject]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div id="cp-scriptpanel" className="row g-4 text-white">
      <div className="col-xxl-8">
        <div className="cp-bg-dark p-4 cp-rounded">
          <ProjectNameEditor />
          <ScriptEditor
            script={script} 
            setScript={setScript}
            scenes={scenes}
          />
          <PromptInput 
            script={script}
            setScript={setScript}
            characters={characters} 
            setCharacters={setCharacters}
            scenes={scenes}
            selectedTones={selectedTones}
          />
        </div>
      </div>
      <div className="col-xxl-4">
        <div className="cp-bg-dark p-4 cp-rounded h-100">
          <div className="mb-4">
            <p className="mb-1 fw-600 opacity-50 ms-2">Genre</p>
            <GenreSelector
              selectedGenres={selectedGenres}
              setSelectedGenres={setSelectedGenres}
            />
          </div>
          <div className="mb-4">
            <p className="mb-1 fw-600 opacity-50 ms-2">Tone</p>
            <ToneSelector
              selectedTones={selectedTones}
              setSelectedTones={setSelectedTones}
            />
          </div>
          <div className="mb-4">
            <Characters
              characters={characters}
              setCharacters={setCharacters}
            />
          </div>
          <div className="mb-0">
            <SceneList
              scenes={scenes}
              setScenes={setScenes}
              characters={characters}
            />
            <button
              className="btn cp-btn-dark btn-sm cp-green mt-3"
              onClick={async () => {
                try {
                  const generated = generateScriptFromScenes(scenes);
                  console.log("Generated script:", generated);
                  setScript(generated);
                  const wordCount = generated.trim().split(/\s+/).filter(Boolean).length || 0;
                  await updateProject({
                    script: {
                      content: generated,
                      wordCount: isNaN(wordCount) ? 0 : wordCount,
                    },
                  });
                  triggerToast("Script generated from scenes!", "success");
                } catch (error) {
                  console.error("Failed to generate and save script:", error);
                  triggerToast("Failed to generate script", "error");
                }
              }}
              disabled={scenes.length === 0}
            >
              Scenes to Script
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}