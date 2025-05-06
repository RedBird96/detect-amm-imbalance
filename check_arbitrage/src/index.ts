/**
 * Main entry point for the arbitrage detection application.
 * This file serves as the bootstrap point for the entire application.
 * It handles application initialization and graceful shutdown procedures.
 * 
 * The application follows a modular architecture with the following components:
 * - App: Main application orchestrator
 * - DatabaseManager: Handles database operations
 * - ArbitrageCalculator: Core arbitrage detection logic
 * - WebSocketManager: Real-time updates broadcasting
 * - EventSubscriber: Blockchain event monitoring
 * 
 * @module index
 */

import { App } from "./app/App";

/**
 * Main function that initializes and runs the application.
 * Sets up graceful shutdown handlers for SIGINT and SIGTERM signals.
 * Ensures proper cleanup of resources on application termination.
 * 
 * @function main
 * @async
 * @throws {Error} If application initialization fails
 */
async function main() {
  const app = new App();

  try {
    await app.initialize();

    // Handle graceful shutdown on SIGINT (Ctrl+C)
    process.on("SIGINT", async () => {
      console.log("Received SIGINT. Shutting down...");
      await app.cleanup();
      process.exit(0);
    });

    // Handle graceful shutdown on SIGTERM
    process.on("SIGTERM", async () => {
      console.log("Received SIGTERM. Shutting down...");
      await app.cleanup();
      process.exit(0);
    });
  } catch (error) {
    console.error("Error in application:", error);
    await app.cleanup();
    process.exit(1);
  }
}

// Start the application and handle any uncaught errors
main().catch(console.error);
