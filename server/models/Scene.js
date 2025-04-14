const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Script = require('./Script');

const Scene = sequelize.define('Scene', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  scriptId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Script,
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
}, {
  tableName: 'scenes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Scene.associate = (models) => {
  Scene.belongsTo(models.Script, {
    foreignKey: 'scriptId',
    as: 'script',
  });
  Scene.hasMany(models.Dialogue, {
    foreignKey: 'sceneId',
    as: 'dialogues',
  });
};

module.exports = Scene;