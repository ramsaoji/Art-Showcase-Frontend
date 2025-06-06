// src/server.ts
import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routes';
import { createContext } from './trpc';
import config from './config';
import logger from './config/logger';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';

// Create Express application
const app = express();

// Apply global middleware
app.use(express.json(config.bodyParser));
app.use(express.urlencoded(config.express.urlencoded));
app.use(cors(config.cors));

// Apply custom middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  logger.info('Health check endpoint called');
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount tRPC router
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      logger.error({ error, path }, 'tRPC error in Express middleware');
    },
  })
);

// Apply error handler middleware (must be last)
app.use(errorHandler);

export default app;