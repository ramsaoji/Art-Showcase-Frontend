// src/trpc/index.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import prisma from "../db/prisma";
import logger from "../config/logger";

// Context type definition
export type Context = {
  prisma: typeof prisma;
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
};

// Create context function that matches tRPC expectations
export const createContext = ({
  req,
  res,
}: CreateExpressContextOptions): Context => {
  logger.debug({ path: req.path, method: req.method }, "Creating tRPC context");

  return {
    prisma,
    req,
    res,
  };
};

// Initialize tRPC with proper context type
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    logger.error({ error }, "tRPC error");
    return {
      ...shape,
      data: {
        ...shape.data,
        message: error.message,
        code: error.code,
      },
    };
  },
});

// Export router and procedure helpers
export const router = t.router;
export const procedure = t.procedure;
export const middleware = t.middleware;

// Create a middleware for handling errors
export const errorHandler = middleware(async ({ path, type, next }) => {
  try {
    return await next();
  } catch (error) {
    logger.error({ path, type, error }, "tRPC procedure error");

    if (error instanceof TRPCError) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message,
      cause: error,
    });
  }
});

// Create a protected procedure that uses the error handler
export const protectedProcedure = procedure.use(errorHandler);
