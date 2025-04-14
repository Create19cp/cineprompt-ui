const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Project = require('./Project');

const Script = sequelize.define('Script', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  wordCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Project, // Use Project model
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
}, {
  tableName: 'scripts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Script.associate = (models) => {
  Script.belongsTo(models.Project, {
    foreignKey: 'projectId',
    as: 'project',
  });
  Script.hasMany(models.Scene, {
    foreignKey: 'scriptId',
    as: 'scenes',
  });
};

module.exports = Script;