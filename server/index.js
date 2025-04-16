const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Project, Script, Scene, Character, Dialogue } = require('./models');
const sequelize = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/audio', express.static(path.join(__dirname, 'public/audio')));

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');

    // Sync all models with alter:true to preserve data
    await Project.sync({ alter: true });
    await Script.sync({ alter: true });
    await Scene.sync({ alter: true });
    await Character.sync({ alter: true });
    await Dialogue.sync({ alter: true });
    console.log('Database tables synced');

    // Only create default project if no projects exist
    const projectCount = await Project.count();
    if (projectCount === 0) {
      const defaultProject = await Project.create({
        name: 'My First Project',
        genres: [],
        tones: [],
      });

      const script = await Script.create({
        content: '',
        wordCount: 0,
        projectId: defaultProject.id,
      });

      await defaultProject.setScript(script);
      console.log('Created default project with ID:', defaultProject.id);
    }

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

app.post('/api/narakeet/tts', async (req, res) => {
  try {
    const { text, voiceId } = req.body;

    if (!text || !voiceId) {
      console.warn('Missing text or voiceId in request:', req.body);
      return res.status(400).json({ error: 'Text and voiceId are required' });
    }

    if (text.length > 1000) {
      console.warn('Text exceeds 1KB limit:', text.length);
      return res.status(400).json({ error: 'Text must be under 1000 characters' });
    }

    const apiKey = process.env.NARAKEET_API_KEY;
    if (!apiKey) {
      console.error('Narakeet API key not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const filename = `audio-${Date.now()}-${voiceId}.mp3`;
    const filePath = path.join(__dirname, 'public/audio', filename);

    const response = await axios.post(
      `https://api.narakeet.com/text-to-speech/mp3?voice=${voiceId}`,
      text,
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'text/plain',
          'accept': 'application/octet-stream',
        },
        responseType: 'stream',
      }
    );

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    const audioUrl = `http://localhost:3001/audio/${filename}`;
    console.log(`Generated audio for voice ${voiceId} with text: "${text}" at ${audioUrl}`);
    res.json({ audioUrl });
  } catch (error) {
    console.error('Error generating Narakeet audio:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    res.status(error.response?.status || 500).json({
      error: 'Failed to generate audio',
      details: error.response?.data?.message || error.message,
    });
  }
});

app.get('/test-db', async (req, res) => {
  try {
    await sequelize.authenticate();
    console.log('Database connection successful');

    const testProject = await Project.create({
      name: 'Test Project',
      genres: ['drama', 'comedy'],
      tones: ['serious', 'lighthearted'],
    });

    const testScript = await Script.create({
      content: 'This is a test script',
      wordCount: 5,
      projectId: testProject.id,
    });

    await testProject.setScript(testScript);

    const testScene = await Scene.create({
      name: 'Test Scene',
      description: 'This is a test scene',
      scriptId: testScript.id,
    });

    await testScript.addScene(testScene);

    const testCharacter = await Character.create({
      name: 'Test Character',
      description: 'This is a test character',
      color: '#FF0000',
      projectId: testProject.id,
      voiceId: null,
    });

    await testProject.addCharacter(testCharacter);

    const testDialogue = await Dialogue.create({
      content: 'Hello, world!',
      orderIndex: 1,
      sceneId: testScene.id,
      characterId: testCharacter.id,
    });

    await testScene.addDialogue(testDialogue);

    const projectWithRelations = await Project.findOne({
      where: { id: testProject.id },
      include: [
        {
          model: Script,
          as: 'script',
          include: [
            {
              model: Scene,
              as: 'scenes',
              include: [
                {
                  model: Dialogue,
                  as: 'dialogues',
                  include: [{ model: Character, as: 'character' }],
                  order: [['orderIndex', 'ASC']],
                },
              ],
            },
          ],
        },
        {
          model: Character,
          as: 'characters',
        },
      ],
    });

    res.json({
      message: 'Database test successful',
      data: projectWithRelations,
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      message: 'Database test failed',
      error: error.message,
    });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CinePrompt API' });
});

app.get('/api/projects', async (req, res) => {
  try {
    console.log('Fetching all projects...');
    const projects = await Project.findAll({
      include: [
        {
          model: Script,
          as: 'script',
          include: [
            {
              model: Scene,
              as: 'scenes',
              include: [
                {
                  model: Dialogue,
                  as: 'dialogues',
                  include: [{ model: Character, as: 'character' }],
                  order: [['orderIndex', 'ASC']],
                },
              ],
            },
          ],
        },
        {
          model: Character,
          as: 'characters',
        },
      ],
    });
    console.log('Found projects:', projects.length);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      error: 'Failed to fetch projects',
      details: error.message,
    });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    console.log(`Fetching project with ID: ${req.params.id}`);
    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: Script,
          as: 'script',
          include: [
            {
              model: Scene,
              as: 'scenes',
              include: [
                {
                  model: Dialogue,
                  as: 'dialogues',
                  include: [{ model: Character, as: 'character' }],
                  order: [['orderIndex', 'ASC']],
                },
              ],
            },
          ],
        },
        {
          model: Character,
          as: 'characters',
        },
      ],
    });
    if (!project) {
      console.log(`Project not found with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Project not found' });
    }
    console.log('Found project:', project.id);
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      error: 'Failed to fetch project',
      details: error.message,
    });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const project = await Project.create(req.body);
    const script = await Script.create({
      content: '',
      wordCount: 0,
      projectId: project.id,
    });
    await project.setScript(script);
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project', details: error.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    console.log('Received update request:', JSON.stringify(req.body, null, 2));
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      console.log(`Project not found with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Project not found' });
    }

    await project.update({
      name: req.body.name || project.name,
      genres: Array.isArray(req.body.genres) ? req.body.genres : project.genres,
      tones: Array.isArray(req.body.tones) ? req.body.tones : project.tones,
    }, { logging: console.log });
    console.log('Updated project fields:', project.toJSON());

    let script = await project.getScript();
    if (!script) {
      script = await Script.create({
        content: '',
        wordCount: 0,
        projectId: project.id,
      }, { logging: console.log });
      await project.setScript(script);
    }

    if (Array.isArray(req.body.characters)) {
      console.log('Processing characters:', JSON.stringify(req.body.characters, null, 2));
      const existingCharacters = await project.getCharacters();
      const existingCharacterIds = new Set(existingCharacters.map(c => c.id));

      for (const character of req.body.characters) {
        if (!character.name) {
          console.warn('Skipping character: missing name', character);
          continue;
        }
        try {
          if (character.id) {
            const existingChar = existingCharacters.find(c => c.id === character.id);
            if (existingChar) {
              console.log(`Updating character ${character.id} with voiceId: ${character.voiceId || 'null'}`, character);
              await existingChar.update({
                name: character.name,
                description: character.description || null,
                color: character.color || '#000000',
                voiceId: character.voiceId === undefined ? null : character.voiceId,
              }, { logging: console.log });
              console.log(`Updated character ${character.id} in database:`, existingChar.toJSON());
              existingCharacterIds.delete(character.id);
            } else {
              console.warn(`Character ${character.id} not found for update`, character);
            }
          } else {
            console.log(`Creating new character with voiceId: ${character.voiceId || 'null'}`, character);
            const newChar = await Character.create({
              name: character.name,
              description: character.description || null,
              color: character.color || '#000000',
              projectId: project.id,
              voiceId: character.voiceId === undefined ? null : character.voiceId,
            }, { logging: console.log });
            console.log(`Created new character in database:`, newChar.toJSON());
            await project.addCharacter(newChar);
          }
        } catch (error) {
          console.error(`Error processing character ${character.id || 'new'}:`, error.message);
          throw error;
        }
      }
      for (const charId of existingCharacterIds) {
        const charToDelete = existingCharacters.find(c => c.id === charId);
        if (charToDelete) {
          console.log(`Deleting character ${charId}`);
          await charToDelete.destroy({ logging: console.log });
        }
      }
    } else {
      console.warn('No characters provided in request');
    }

    if (Array.isArray(req.body.scenes)) {
      console.log('Processing scenes:', JSON.stringify(req.body.scenes, null, 2));
      const existingScenes = await script.getScenes();
      const existingSceneIds = new Set(existingScenes.map(s => s.id));

      for (const scene of req.body.scenes) {
        if (!scene.name) {
          console.warn('Skipping scene: missing name', scene);
          continue;
        }

        let sceneInstance;
        if (scene.id && existingSceneIds.has(scene.id)) {
          // Update existing scene
          sceneInstance = existingScenes.find(s => s.id === scene.id);
          console.log('Updating scene:', scene);
          await sceneInstance.update({
            name: scene.name,
            description: scene.description || null,
          }, { logging: console.log });
          existingSceneIds.delete(scene.id);
        } else {
          // Create new scene
          console.log('Creating scene:', scene);
          sceneInstance = await Scene.create({
            name: scene.name,
            description: scene.description || null,
            scriptId: script.id,
          }, { logging: console.log });
          await script.addScene(sceneInstance);
        }

        // Handle dialogues
        if (Array.isArray(scene.dialogues)) {
          console.log(`Processing dialogues for scene ${sceneInstance.id}:`, scene.dialogues);
          const existingDialogues = await sceneInstance.getDialogues();
          const existingDialogueIds = new Set(existingDialogues.map(d => d.id));

          const incomingDialogues = scene.dialogues.sort((a, b) => a.orderIndex - b.orderIndex);
          for (const dialogue of incomingDialogues) {
            if (!dialogue.content || !dialogue.characterId) {
              console.warn('Skipping dialogue: missing content or characterId', dialogue);
              continue;
            }

            if (dialogue.id && existingDialogueIds.has(dialogue.id)) {
              // Update existing dialogue
              const existingDialogue = existingDialogues.find(d => d.id === dialogue.id);
              console.log('Updating dialogue:', dialogue);
              await existingDialogue.update({
                content: dialogue.content,
                orderIndex: dialogue.orderIndex || 0,
                characterId: dialogue.characterId,
              }, { logging: console.log });
              existingDialogueIds.delete(dialogue.id);
            } else {
              // Create new dialogue
              console.log('Creating dialogue:', dialogue);
              const newDialogue = await Dialogue.create({
                content: dialogue.content,
                orderIndex: dialogue.orderIndex || 0,
                sceneId: sceneInstance.id,
                characterId: dialogue.characterId,
              }, { logging: console.log });
              await sceneInstance.addDialogue(newDialogue);
            }
          }

          // Delete removed dialogues
          for (const dialogueId of existingDialogueIds) {
            const dialogueToDelete = existingDialogues.find(d => d.id === dialogueId);
            if (dialogueToDelete) {
              console.log(`Deleting dialogue ${dialogueId}`);
              await dialogueToDelete.destroy({ logging: console.log });
            }
          }
        }
      }

      // Delete removed scenes
      for (const sceneId of existingSceneIds) {
        const sceneToDelete = existingScenes.find(s => s.id === sceneId);
        if (sceneToDelete) {
          console.log(`Deleting scene ${sceneId}`);
          await sceneToDelete.destroy({ logging: console.log });
        }
      }
    }

    if (req.body.script && typeof req.body.script.content === 'string') {
      console.log('Processing script update:', req.body.script);
      await script.update({
        content: req.body.script.content,
        wordCount: Number.isInteger(req.body.script.wordCount) ? req.body.script.wordCount : 0,
      }, { logging: console.log });
    }

    const updatedProject = await Project.findByPk(req.params.id, {
      include: [
        {
          model: Script,
          as: 'script',
          include: [
            {
              model: Scene,
              as: 'scenes',
              include: [
                {
                  model: Dialogue,
                  as: 'dialogues',
                  include: [{ model: Character, as: 'character' }],
                  order: [['orderIndex', 'ASC']],
                },
              ],
            },
          ],
        },
        { model: Character, as: 'characters' },
      ],
    });

    if (!updatedProject) {
      console.error('Failed to fetch updated project');
      return res.status(500).json({ error: 'Failed to retrieve updated project' });
    }

    console.log('Returning updated project:', JSON.stringify(updatedProject.toJSON(), null, 2));
    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error.message, error.stack);
    res.status(500).json({
      error: 'Failed to update project',
      details: error.message,
    });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    await project.destroy({ logging: console.log });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project', details: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message,
  });
});