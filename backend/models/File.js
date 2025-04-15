// backend/models/File.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('File', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    uploadDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });
};