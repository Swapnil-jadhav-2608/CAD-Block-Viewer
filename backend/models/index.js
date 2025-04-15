// backend/models/index.js
const { Sequelize } = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

const File = require('./File')(sequelize);
const Block = require('./Block')(sequelize);

File.hasMany(Block, { onDelete: 'CASCADE' });
Block.belongsTo(File);

module.exports = {
  sequelize,
  File,
  Block
};
