import React, { useRef, useState } from "react";
import { useProject } from "../../context/ProjectContext";
import ScriptContextMenu from "./ScriptContextMenu";
import { useToast } from "../../context/ToastContext";
import useOpenAI from "../../hooks/useOpenAI";

export default function ScriptEditor({ script, setScript }) {
  const { currentProject } = useProject();
  const { callOpenAI } = useOpenAI();
  const textareaRef = useRef(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, text: "" });
  const [promptInput, setPromptInput] = useState("Rewrite this to be better");

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (e) => setScript(e.target.result);
      reader.readAsText(file);
    }
  };

  const handleExport = () => {
    const blob = new Blob([script], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentProject?.name || "script"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;

  const handleContextMenu = (e) => {
    e.preventDefault();
    const textarea = textareaRef.current;
    const selection = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    if (!selection.trim()) return;

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      text: selection,
    });
    setPromptInput("Rewrite this to be better");
  };

  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleSendToAI = async () => {
    const textarea = textareaRef.current;
    const { selectionStart, selectionEnd } = textarea;
    const prompt = `${promptInput.trim()}:\n\n${contextMenu.text}`;
    const aiResponse = await callOpenAI(prompt);

    if (aiResponse) {
      const updated = script.substring(0, selectionStart) + aiResponse + script.substring(selectionEnd);
      setScript(updated);
      closeContextMenu();
    }
  };

  return (
    <div onClick={closeContextMenu}>
      {/* Word Count */}
      <div className="d-flex justify-content-between align-items-center mb-2 px-1">
        <p className="mb-0 fw-600 opacity-50 ms-1">Script Editor</p>
        <div>
          <span className="fw-600">
            <span className="opacity-50">Word Count:</span>{" "}
            <span className="cp-text-green fw-bold">{wordCount}</span>
          </span>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        className="form-control text-white border-0 w-100 cp-rounded p-4 fw-600"
        style={{
          height: "500px",
          fontFamily: "Courier New, monospace",
          fontSize: "14px",
          lineHeight: "1.6",
          resize: "none",
        }}
        placeholder="In a land far, far away..."
        value={script}
        onChange={(e) => {
          const textarea = e.target;
          setScript(textarea.value);
          textarea.style.height = "auto";
          textarea.style.height = textarea.scrollHeight + "px";
        }}
        onContextMenu={handleContextMenu}
        rows={1}
      ></textarea>

      {/* Bottom Bar */}
      <div className="d-flex justify-content-end align-items-center mt-3">
        <div className="d-flex gap-2">
          <label className="btn cp-btn-dark cp-green mb-0 btn-sm">
            <i className="bi bi-file-earmark-text me-2 cp-text-green"></i> Import
            <input type="file" accept=".txt" onChange={handleImport} hidden />
          </label>
          <button className="btn cp-btn-dark cp-green btn-sm" onClick={handleExport}>
            <i className="bi bi-download me-2 cp-text-green"></i> Export
          </button>
        </div>
      </div>

      {/* Context Menu: only Send to AI */}
      {contextMenu.visible && (
        <ScriptContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          selectedText={contextMenu.text}
          promptInput={promptInput}
          setPromptInput={setPromptInput}
          onSendToAI={handleSendToAI}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}
