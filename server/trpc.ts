// server/trpc.ts - Fixed tRPC configuration
import { initTRPC } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import superjson from "superjson";
import { PrismaClient } from "@prisma/client";

// Create Prisma client singleton
const prisma = new PrismaClient();

// Create context function that matches tRPC expectations
export const createContext = (opts?: CreateExpressContextOptions) => {
  console.log("Creating tRPC context");
  return {
    prisma,
    req: opts?.req,
    res: opts?.res,
  };
};

type Context = ReturnType<typeof createContext>;

// Initialize tRPC with proper context type
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
