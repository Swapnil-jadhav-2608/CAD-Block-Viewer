// backend/app.js
const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const { sequelize } = require('./models');
const blockRoutes = require('./routes/blockRoutes');
const fileRoutes = require('./routes/fileRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/blocks', blockRoutes);
app.use('/api/files', fileRoutes);

// Global error handling middleware (alwaasxys at the end)
app.use(errorHandler);

// Sync Database and start server
sequelize.sync()
  .then(() => {
    console.log('Database synced successfully.');
    app.listen(3000, () => console.log('Server running on port 3000'));
  })
  .catch(err => console.error('Error syncing database:', err));
