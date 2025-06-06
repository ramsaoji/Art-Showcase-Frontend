// src/routes/index.ts
import { router } from '../trpc';
import { artworkRouter } from './artwork';

// Create the main app router
export const appRouter = router({
  artwork: artworkRouter,
});


// Export type definition of API
export type AppRouter = typeof appRouter;