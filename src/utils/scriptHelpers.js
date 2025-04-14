// utils/scriptHelpers.js
export function generateScriptFromScenes(scenes) {
  if (!Array.isArray(scenes)) {
    console.warn('generateScriptFromScenes: scenes is not an array', scenes);
    return '';
  }

  const scriptLines = scenes
    .map((scene, index) => {
      if (!scene || !scene.name || typeof scene.name !== 'string') {
        console.warn(`Skipping invalid scene at index ${index}`, scene);
        return null;
      }

      const header = `[SCENE: ${scene.name.trim()}]`;
      const description = scene.description?.trim() ? scene.description.trim() : '(No description)';
      const dialogues = Array.isArray(scene.dialogues)
        ? scene.dialogues
            .map((d, dIndex) => {
              if (!d || !d.content || typeof d.content !== 'string') {
                console.warn(`Skipping invalid dialogue at scene ${index}, index ${dIndex}`, d);
                return null;
              }
              const name = (d.characterName || d.character?.name || 'UNKNOWN').toUpperCase().trim();
              const line = d.content.trim();
              return `${name}: ${line}`;
            })
            .filter(line => line)
            .join('\n')
        : '';

      const sceneText = [header, description, dialogues].filter(Boolean).join('\n');
      return sceneText;
    })
    .filter(text => text && text.trim());

  const finalScript = scriptLines.join('\n\n----------\n\n') || '';
  console.log('Generated script:', finalScript);
  return finalScript;
}

export function parseScriptToScenes(script) {
  if (typeof script !== 'string' || !script.trim()) {
    console.warn('parseScriptToScenes: invalid or empty script', script);
    return [];
  }

  const scenes = [];
  const sceneRegex = /\[SCENE:\s*(.*?)\](?:\n|$)([\s\S]*?)(?=\[SCENE:|$)/gi;

  let match;
  while ((match = sceneRegex.exec(script)) !== null) {
    const sceneName = match[1].trim();
    if (!sceneName) continue;

    const sceneContent = match[2].trim();
    const dialogues = [];
    const dialogueRegex = /^([^\n:]+?):\s*([\s\S]*?)(?=\n{2,}|$|^[^\n:]+?:)/gmi;
    let dialogueMatch;

    while ((dialogueMatch = dialogueRegex.exec(sceneContent)) !== null) {
      const characterName = dialogueMatch[1].trim();
      const content = dialogueMatch[2].trim();
      if (characterName && content) {
        dialogues.push({
          characterName,
          content,
          orderIndex: dialogues.length,
        });
      }
    }

    const descriptionMatch = sceneContent.match(/^([\s\S]*?)(?=(?:^[^\n:]+?:|\n{2,}|$))/mi);
    const description = descriptionMatch ? descriptionMatch[1].trim() : '';

    scenes.push({
      id: `scene-${scenes.length}-${Date.now()}`, // Stable temp ID
      name: sceneName,
      description: description || '',
      dialogues,
    });
  }

  console.log('Parsed scenes:', scenes);
  return scenes;
}

export function parseScriptToCharacters(script) {
  if (typeof script !== 'string' || !script.trim()) {
    console.warn('parseScriptToCharacters: invalid or empty script', script);
    return [];
  }

  const characters = new Set();
  const characterRegex = /^([^\n:]+?):\s*/gmi;

  let match;
  while ((match = characterRegex.exec(script)) !== null) {
    const characterName = match[1].trim();
    if (
      characterName &&
      !characterName.toUpperCase().includes('SCENE') &&
      !characterName.toUpperCase().includes('INT') &&
      !characterName.toUpperCase().includes('EXT')
    ) {
      characters.add(characterName.toLowerCase());
    }
  }

  const characterList = Array.from(characters).map((name, index) => ({
    id: `char-${index}-${name.replace(/\s+/g, '-')}`,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    description: `Character: ${name.charAt(0).toUpperCase() + name.slice(1)}`,
    color: getRandomColor(),
  }));

  console.log('Parsed characters:', characterList);
  return characterList;
}

const getRandomColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
    '#D4A5A5', '#9B59B6', '#E67E22', '#1ABC9C', '#3498DB',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};