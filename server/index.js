const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Project, Script, Scene, Character, Dialogue } = require('./models');
const sequelize = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Sync database and start server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');

    await sequelize.drop();
    console.log('All tables dropped');

    await Project.sync({ force: true });
    console.log('Projects table created');

    await Script.sync({ force: true });
    console.log('Scripts table created');

    await Scene.sync({ force: true });
    console.log('Scenes table created');

    await Character.sync({ force: true });
    console.log('Characters table created');

    await Dialogue.sync({ force: true });
    console.log('Dialogues table created');

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

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Test database connection
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
      orderIndex: 1,
      scriptId: testScript.id,
    });

    await testScript.addScene(testScene);

    const testCharacter = await Character.create({
      name: 'Test Character',
      description: 'This is a test character',
      color: '#FF0000',
      projectId: testProject.id,
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

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CinePrompt API' });
});

// Project routes
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
                  order: [['orderIndex', 'ASC']], // Sort dialogues by orderIndex
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
    });
    console.log('Updated project fields:', project.toJSON());

    let script = await project.getScript();
    if (!script) {
      script = await Script.create({
        content: '',
        wordCount: 0,
        projectId: project.id,
      });
      await project.setScript(script);
    }

    if (Array.isArray(req.body.characters)) {
      console.log('Processing characters:', req.body.characters);
      const existingCharacters = await project.getCharacters();
      const existingCharacterIds = new Set(existingCharacters.map(c => c.id));

      for (const character of req.body.characters) {
        if (!character.name) {
          console.warn('Skipping character: missing name', character);
          continue;
        }
        if (character.id) {
          const existingChar = existingCharacters.find(c => c.id === character.id);
          if (existingChar) {
            console.log(`Updating character ${character.id}:`, character);
            await existingChar.update({
              name: character.name,
              description: character.description || null,
              color: character.color || '#000000',
            });
            existingCharacterIds.delete(character.id);
          }
        } else {
          console.log('Creating new character:', character);
          const newChar = await Character.create({
            name: character.name,
            description: character.description || null,
            color: character.color || '#000000',
            projectId: project.id,
          });
          await project.addCharacter(newChar);
        }
      }
      for (const charId of existingCharacterIds) {
        const charToDelete = existingCharacters.find(c => c.id === charId);
        if (charToDelete) {
          console.log(`Deleting character ${charId}`);
          await charToDelete.destroy();
        }
      }
    }

    if (Array.isArray(req.body.scenes)) {
      console.log('Processing scenes:', req.body.scenes);
      const existingScenes = await script.getScenes();
      const existingSceneIds = new Set(existingScenes.map(s => s.id));

      for (const scene of req.body.scenes) {
        if (!scene.name || !scene.scriptId) {
          console.warn('Skipping scene: missing name or scriptId', scene);
          continue;
        }
        let sceneInstance;
        if (scene.id) {
          sceneInstance = existingScenes.find(s => s.id === scene.id);
          if (sceneInstance) {
            console.log(`Updating scene ${scene.id}:`, scene);
            await sceneInstance.update({
              name: scene.name,
              description: scene.description || null,
              orderIndex: scene.orderIndex || 0,
            });
            existingSceneIds.delete(scene.id);
          }
        } else {
          console.log('Creating new scene:', scene);
          sceneInstance = await Scene.create({
            name: scene.name,
            description: scene.description || null,
            orderIndex: scene.orderIndex || existingScenes.length,
            scriptId: script.id,
          });
          await script.addScene(sceneInstance);
        }

        if (sceneInstance && Array.isArray(scene.dialogues)) {
          console.log(`Processing dialogues for scene ${sceneInstance.id}:`, scene.dialogues);
          const existingDialogues = await sceneInstance.getDialogues();
          const existingDialogueIds = new Set(existingDialogues.map(d => d.id));
          const incomingDialogues = scene.dialogues.sort((a, b) => a.orderIndex - b.orderIndex); // Sort by orderIndex
          const incomingDialogueIds = new Set(incomingDialogues.filter(d => d.id).map(d => d.id));

          for (const dialogue of incomingDialogues) {
            if (!dialogue.content || !dialogue.characterId) {
              console.warn('Skipping dialogue: missing content or characterId', dialogue);
              continue;
            }
            if (dialogue.id) {
              const existingDialogue = existingDialogues.find(d => d.id === dialogue.id);
              if (existingDialogue) {
                console.log(`Updating dialogue ${dialogue.id}:`, dialogue);
                await existingDialogue.update({
                  content: dialogue.content,
                  orderIndex: dialogue.orderIndex || existingDialogues.length,
                  characterId: dialogue.characterId,
                });
                existingDialogueIds.delete(dialogue.id);
              } else {
                console.warn(`Dialogue ID ${dialogue.id} not found, creating new`);
                const newDialogue = await Dialogue.create({
                  content: dialogue.content,
                  orderIndex: dialogue.orderIndex || existingDialogues.length,
                  sceneId: sceneInstance.id,
                  characterId: dialogue.characterId,
                });
                await sceneInstance.addDialogue(newDialogue);
              }
            } else {
              console.log('Creating new dialogue:', dialogue);
              const duplicate = existingDialogues.find(
                d => d.content === dialogue.content && d.characterId === dialogue.characterId
              );
              if (duplicate) {
                console.warn('Duplicate dialogue detected, skipping:', dialogue);
                continue;
              }
              const newDialogue = await Dialogue.create({
                content: dialogue.content,
                orderIndex: dialogue.orderIndex || existingDialogues.length,
                sceneId: sceneInstance.id,
                characterId: dialogue.characterId,
              });
              await sceneInstance.addDialogue(newDialogue);
            }
          }

          for (const dialogueId of existingDialogueIds) {
            if (!incomingDialogueIds.has(dialogueId)) {
              const dialogueToDelete = existingDialogues.find(d => d.id === dialogueId);
              if (dialogueToDelete) {
                console.log(`Deleting dialogue ${dialogueId}`);
                await dialogueToDelete.destroy();
              }
            }
          }
        }
      }

      for (const sceneId of existingSceneIds) {
        const sceneToDelete = existingScenes.find(s => s.id === sceneId);
        if (sceneToDelete) {
          console.log(`Deleting scene ${sceneId}`);
          await sceneToDelete.destroy();
        }
      }
    }

    if (req.body.script && typeof req.body.script.content === 'string') {
      console.log('Processing script update:', req.body.script);
      await script.update({
        content: req.body.script.content,
        wordCount: Number.isInteger(req.body.script.wordCount) ? req.body.script.wordCount : 0,
      });
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
    await project.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project', details: error.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message,
  });
});