// src/middleware/requestLogger.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

/**
 * Middleware to log all incoming requests
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Get the start time
  const start = process.hrtime();
  
  // Log the request
  logger.info({
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent') || 'unknown',
  }, 'Request received');

  // Log the response when it's sent
  res.on('finish', () => {
    // Calculate the response time
    const [seconds, nanoseconds] = process.hrtime(start);
    const responseTimeMs = (seconds * 1000 + nanoseconds / 1000000).toFixed(2);
    
    // Log the response
    const logMethod = res.statusCode >= 400 ? 'warn' : 'info';
    logger[logMethod]({
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTimeMs}ms`,
    }, 'Request completed');
  });

  next();
};