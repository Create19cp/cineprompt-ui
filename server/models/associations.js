const Project = require('./Project');
const Script = require('./Script');
const Scene = require('./Scene');
const Character = require('./Character');

function setupAssociations() {
  // Project associations
  Project.hasMany(Character, {
    foreignKey: 'projectId',
    as: 'characters'
  });
  Project.hasOne(Script, {
    foreignKey: 'projectId',
    as: 'script'
  });

  // Script associations
  Script.belongsTo(Project, {
    foreignKey: 'projectId',
    as: 'project'
  });
  Script.hasMany(Scene, {
    foreignKey: 'scriptId',
    as: 'scenes'
  });

  // Scene associations
  Scene.belongsTo(Script, {
    foreignKey: 'scriptId',
    as: 'script'
  });

  // Character associations
  Character.belongsTo(Project, {
    foreignKey: 'projectId',
    as: 'project'
  });
}

module.exports = setupAssociations; 