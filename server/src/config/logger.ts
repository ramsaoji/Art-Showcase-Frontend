// src/config/logger.ts
import pino from 'pino';

// Configure the logger with appropriate log levels and formatting
const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  // Add base properties that will be included in all log records
  base: {
    app: 'art-showcase-api',
  },
});

export default logger;