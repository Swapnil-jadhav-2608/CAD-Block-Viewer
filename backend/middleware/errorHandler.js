// backend/middleware/errorHandler.js
module.exports = (err, req, res, next) => {
    console.error('Global error handler caught:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      details: err.message
    });
  };