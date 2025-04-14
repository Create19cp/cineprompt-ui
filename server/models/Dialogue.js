const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Scene = require('./Scene');
const Character = require('./Character');

const Dialogue = sequelize.define('Dialogue', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  sceneId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Scene,
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  characterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Character,
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
}, {
  tableName: 'dialogues',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Dialogue.associate = (models) => {
  Dialogue.belongsTo(models.Scene, {
    foreignKey: 'sceneId',
    as: 'scene',
  });
  Dialogue.belongsTo(models.Character, {
    foreignKey: 'characterId',
    as: 'character',
  });
};

module.exports = Dialogue;