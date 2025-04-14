const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  genres: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  tones: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  }
}, {
  tableName: 'projects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Project.associate = (models) => {
  Project.hasOne(models.Script, {
    foreignKey: 'projectId',
    as: 'script',
  });
  Project.hasMany(models.Character, {
    foreignKey: 'projectId',
    as: 'characters',
  });
};

module.exports = Project; 