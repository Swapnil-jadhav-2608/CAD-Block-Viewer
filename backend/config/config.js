// backend/config/config.js
module.exports = {
  development: {
    username: 'postgres',
    password: 'password',
    database: 'cad_db',
    host: '127.0.0.1',
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false
  }
};
