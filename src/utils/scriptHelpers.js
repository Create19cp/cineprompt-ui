export function generateScriptFromScenes(scenes) {
    if (!Array.isArray(scenes)) return "";
  
    return scenes
      .map((scene) => {
        const header = `${scene.name || "Untitled Scene"}`;
        const desc = scene.description?.trim() || "(No description)";
        const dialogue = (scene.dialogues || [])
          .map((d) => {
            const name = d.character?.toUpperCase() || "UNKNOWN";
            const line = d.line?.trim() || "";
            return `${name}:\n${line}`;
          })
          .join("\n\n");
  
        return `${header}\n${desc}\n\n${dialogue}`;
      })
      .join("\n\n----------\n\n");
  }
  