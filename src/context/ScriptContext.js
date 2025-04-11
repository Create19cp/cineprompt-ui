import React, { createContext, useContext, useState } from "react";

const ScriptSaveContext = createContext();

export function useScriptSave() {
  return useContext(ScriptSaveContext);
}

export function ScriptSaveProvider({ children }) {
  const [saveFunction, setSaveFunction] = useState(null);

  return (
    <ScriptSaveContext.Provider value={{ saveFunction, setSaveFunction }}>
      {children}
    </ScriptSaveContext.Provider>
  );
}
