import { App } from "./app/App";

/**
 * Main entry point for the arbitrage detection application.
 * Initializes the application and sets up graceful shutdown handlers.
 *
 * @function main
 * @async
 */
async function main() {
  const app = new App();

  try {
    await app.initialize();

    // Graceful shutdown handling
    process.on("SIGINT", async () => {
      console.log("Received SIGINT. Shutting down...");
      await app.cleanup();
      process.exit(0);
    });

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

main().catch(console.error);
