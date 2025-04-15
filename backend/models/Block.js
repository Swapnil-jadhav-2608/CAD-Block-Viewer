// backend/models/Block.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Block', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: 'BLOCK'
    },
    coordinates: {
      type: DataTypes.JSON,
      allowNull: true
    },
    properties: {
      type: DataTypes.JSON,
      allowNull: true
    }
  });
};