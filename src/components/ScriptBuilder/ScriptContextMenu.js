import React, { useState } from "react";

export default function ScriptContextMenu({ x, y, selectedText, onClose, onSendToAI }) {
  
  const [customPrompt, setCustomPrompt] = useState("");

  return (
    <div
      className="cp-context-menu p-3 cp-bg-dark text-white cp-rounded"
      style={{ top: y, left: x, position: "absolute", zIndex: 9999 }}
      onClick={(e) => e.stopPropagation()}
    >

      <textarea
        className="form-control mb-3 form-control-sm"
        rows={2}
        placeholder="e.g. Rewrite to be funnier"
        value={customPrompt}
        onChange={(e) => setCustomPrompt(e.target.value)}
      ></textarea>

      <button
        className="btn btn-sm cp-btn-dark cp-green w-100"
        onClick={() => {
          onSendToAI(selectedText, customPrompt);
          onClose();
        }}
        disabled={!customPrompt.trim()}
      >
        <i className="bi bi-stars me-2 cp-text-green"></i> Submit
      </button>
    </div>
  );
}
