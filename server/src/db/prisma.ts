// src/db/prisma.ts
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Create a singleton instance of PrismaClient
export const prisma = global.prisma || new PrismaClient();

// Log database operations in development
if (process.env.NODE_ENV !== 'production') {
  logger.debug('Prisma Client initialized');
}

// In development, save the singleton instance to global
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;