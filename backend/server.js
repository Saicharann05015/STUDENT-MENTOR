require('dotenv').config();
const validateEnv = require('./config/validateEnv');
const logger = require('./utils/logger');

// Validate environment variables before anything else
validateEnv();

const app = require('./app');
const { PORT } = require('./config/env');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

app.listen(PORT, () => {
  logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});
