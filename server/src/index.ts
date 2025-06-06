// src/index.ts
import app from "./server";
import config from "./config";
import logger from "./config/logger";

// Start the server
const server = app.listen(config.port, () => {
  logger.info(
    { port: config.port, env: config.env },
    `Server started on port ${config.port} in ${config.env} mode`
  );
});

// Handle graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info({ signal }, "Received shutdown signal");

  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });

  // Force close after timeout
  setTimeout(() => {
    logger.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions and rejections
process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "Uncaught exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "Unhandled rejection");
  process.exit(1);
});
