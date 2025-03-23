// server.js - Entry point for the application

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const app = require('./app');
const mongoose = require('mongoose');
const logger = require('./config/logger');

// Define the port
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info('MongoDB connection successful');
    
    // Start the server
    app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});