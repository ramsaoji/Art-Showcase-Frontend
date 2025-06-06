// src/config/index.ts
import dotenv from 'dotenv';
import logger from './logger';

// Load environment variables from .env file
dotenv.config();

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  logger.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const config = {
  // Server configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  env: process.env.NODE_ENV || 'development', // Added for compatibility
  
  // Database configuration
  databaseUrl: process.env.DATABASE_URL,
  
  // CORS configuration
  cors: {
    origin: ["http://localhost:5173", "https://art-showcase.techness.in"],
    credentials: true,
  },
  
  // Express configuration
  bodyParser: {
    limit: '50mb',
  },
  express: {
    json: {
      limit: '50mb',
    },
    urlencoded: {
      extended: true,
      limit: '50mb',
    },
  },
};

export default config;