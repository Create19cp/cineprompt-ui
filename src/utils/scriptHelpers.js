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
      const description = scene.description?.trim() ? scene.description.trim() : '';
      const dialogues = Array.isArray(scene.dialogues)
        ? scene.dialogues
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((d, dIndex) => {
              if (!d || !d.content || typeof d.content !== 'string') {
                console.warn(`Skipping invalid dialogue at scene ${index}, index ${dIndex}`, d);
                return null;
              }
              const name = (d.characterName || d.character?.name || 'UNKNOWN').trim();
              const line = d.content.trim();
              return `[DIALOGUE: ${name}] ${line}`;
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

export function parseScriptToScenes(script, characters = []) {
  if (typeof script !== 'string' || !script.trim()) {
    console.warn('parseScriptToScenes: invalid or empty script', script);
    return [];
  }

  const scenes = [];
  const sceneRegex = /\[SCENE:\s*(.*?)\](?:\n|$)([\s\S]*?)(?=\[SCENE:|$)/gi;
  const characterMap = new Map(
    characters.map(c => [c.name.toLowerCase(), c])
  );

  let match;
  while ((match = sceneRegex.exec(script)) !== null) {
    const sceneName = match[1].trim();
    if (!sceneName) continue;

    const sceneContent = match[2].trim();
    const dialogues = [];
    const dialogueRegex = /\[DIALOGUE:\s*([^\]]+)\]\s*(.*?)(?=\n|$)/gmi;
    let dialogueMatch;

    while ((dialogueMatch = dialogueRegex.exec(sceneContent)) !== null) {
      const characterName = dialogueMatch[1].trim();
      const content = dialogueMatch[2].trim();
      if (!characterName || !content) continue;

      const character = characterMap.get(characterName.toLowerCase());
      dialogues.push({
        id: `dialogue-${scenes.length}-${dialogues.length}-${Date.now()}`,
        characterName,
        content,
        orderIndex: dialogues.length,
        characterId: character ? character.id : null,
      });
    }

    // Capture description, including lines starting with "Description:"
    const descriptionLines = [];
    const descriptionRegex = /^([\s\S]*?)(?=\[DIALOGUE:|$)/i;
    const descriptionMatch = sceneContent.match(descriptionRegex);
    if (descriptionMatch) {
      const rawDescription = descriptionMatch[1].trim();
      const lines = rawDescription.split('\n');
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.match(/^\[CHARACTER:/i)) {
          if (trimmedLine.match(/^Description:/i)) {
            descriptionLines.push(trimmedLine.replace(/^Description:\s*/i, ''));
          } else {
            descriptionLines.push(trimmedLine);
          }
        }
      });
    }
    const description = descriptionLines.join('\n').trim() || '';

    scenes.push({
      id: `scene-${scenes.length}-${Date.now()}`,
      name: sceneName,
      description,
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
  const characterRegex = /\[CHARACTER:\s*([^\]]+)\]|\[DIALOGUE:\s*([^\]]+)\]/gmi;

  let match;
  while ((match = characterRegex.exec(script)) !== null) {
    const characterName = match[1] || match[2];
    const cleanedName = characterName.trim();
    if (
      cleanedName &&
      !cleanedName.toUpperCase().includes('SCENE') &&
      !cleanedName.toUpperCase().includes('INT') &&
      !cleanedName.toUpperCase().includes('EXT') &&
      !cleanedName.toUpperCase().includes('DESCRIPTION')
    ) {
      characters.add(cleanedName.toLowerCase());
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