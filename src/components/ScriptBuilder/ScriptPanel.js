import React from "react";
import ScriptSettings from "./ScriptSettings";
import Characters from "./Characters";
import SceneList from "./SceneList";
import ScriptEditor from "./ScriptSettings";

export default function ScriptPanel() {
  return (
    <div id="cp-scriptpanel" className="cp-bg-darker p-4 cp-rounded-sm text-white">
      {/* Story Settings (Title, Logline, Genre, Tone) */}
      <div className="mb-5">
        <h2 className="h5 mb-3">Story Settings</h2>
        <ScriptSettings />
      </div>

      {/* Characters Section */}
      <div className="mb-5">
        <h2 className="h5 mb-3">Characters</h2>
        <Characters />
      </div>

      {/* Scene List Section */}
      <div className="mb-5">
        <h2 className="h5 mb-3">Scene List</h2>
        <SceneList />
      </div>

      {/* Script Editor */}
      <div className="mb-3">
        <h2 className="h5 mb-3">Script Editor</h2>
        <ScriptEditor />
      </div>
    </div>
  );
}
