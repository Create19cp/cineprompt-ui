import React, { useState, useEffect, useCallback } from "react";
import Characters from "./Characters";
import SceneList from "./SceneList";
import ScriptEditor from "./ScriptEditor";
import GenreSelector from "./GenreSelector";
import ToneSelector from "./ToneSelector";
import { useProject } from "../../context/ProjectContext";
import { useToast } from "../../context/ToastContext";
import { useScriptSave } from "../../context/ScriptSaveContext";
import { generateScriptFromScenes } from "../../utils/scriptHelpers";
import PromptInput from "../MainPrompt/PromptInput";

export default function ScriptPanel() {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedTones, setSelectedTones] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [script, setScript] = useState("");
  const [scenes, setScenes] = useState([]);

  const { currentProject, updateProject } = useProject();
  const { triggerToast } = useToast();
  const { setSaveFunction } = useScriptSave();

  // Load all project data
  useEffect(() => {
    if (currentProject) {
      if (typeof currentProject.script === "string") {
        setScript(currentProject.script);
      }
      if (Array.isArray(currentProject.genres)) {
        setSelectedGenres(currentProject.genres);
      }
      if (Array.isArray(currentProject.tones)) {
        setSelectedTones(currentProject.tones);
      }
      if (Array.isArray(currentProject.characters)) {
        setCharacters(currentProject.characters);
      }
      if (Array.isArray(currentProject.scenes)) {
        setScenes(currentProject.scenes);
      }
    }
  }, [currentProject]);

  const handleManualSave = useCallback(() => {
    if (!currentProject) return;

    updateProject({
      script,
      genres: selectedGenres,
      tones: selectedTones,
      characters,
      scenes,
    });

    triggerToast("Saved!", "success");
  }, [script, selectedGenres, selectedTones, characters, scenes, updateProject, triggerToast, currentProject]);

  useEffect(() => {
    setSaveFunction(() => handleManualSave);
  }, [handleManualSave, setSaveFunction]);

  return (
    <div id="cp-scriptpanel" className="row row-cols-1 row-cols-2 g-4 text-white">
      <div className="col">
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
              className="btn cp-btn-dark cp-green mt-3"
              onClick={() => {
              const generated = generateScriptFromScenes(scenes);
              setScript(generated);
              updateProject({ script: generated });
              triggerToast("Script generated from scenes!", "success");
            }}
            disabled={scenes.length === 0}
          >
            Scenes to Script
          </button>

          </div>
        </div>
      </div>

      <div className="col">
        <div className="cp-bg-dark p-4 cp-rounded">
          <ScriptEditor 
            script={script} 
            setScript={setScript} 
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
    </div>
  );
}
