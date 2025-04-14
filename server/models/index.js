const Project = require('./Project');
const Script = require('./Script');
const Scene = require('./Scene');
const Character = require('./Character');
const Dialogue = require('./Dialogue');

const models = {
  Project,
  Script,
  Scene,
  Character,
  Dialogue,
};

Project.associate(models);
Script.associate(models);
Scene.associate(models);
Character.associate(models);
Dialogue.associate(models);

module.exports = models;