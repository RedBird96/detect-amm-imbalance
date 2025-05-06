import { DatabaseManager } from "../database/dbManager";
import { EventSubscriber } from "../services/eventSubscriber";
import { ArbitrageCalculator } from "../services/arbitrageCalculator";
import { WebSocketManager } from "../server/webSocketServer";
import { EVENT_NAME, WEB_SERVER_PORT } from "../config/constants";

/**
 * Main application class that orchestrates the arbitrage detection system.
 * Manages the lifecycle of database, arbitrage calculator, event subscriber, and WebSocket server.
 */
export class App {
  private dbManager: DatabaseManager | null = null;
  private arbitrageCalculator: ArbitrageCalculator | null = null;
  private eventSubscriber: EventSubscriber | null = null;
  private webSocketManager: WebSocketManager | null = null;
  private cleanupCallbacks: (() => Promise<void>)[] = [];

  /**
   * Initializes all components of the application.
   * Sets up database, arbitrage calculator, WebSocket server, and event subscriber.
   * Also fetches initial pool reserves and starts listening for swap events.
   *
   * @async
   * @returns {Promise<void>}
   */
  async initialize() {
    // Initialize database manager
    this.dbManager = new DatabaseManager();
    await this.dbManager.initialize();

    // Initialize arbitrage calculator
    this.arbitrageCalculator = new ArbitrageCalculator(this.dbManager);
    // Initialize WebSocket server
    this.webSocketManager = new WebSocketManager(Number(WEB_SERVER_PORT));
    this.cleanupCallbacks.push(async () => this.webSocketManager?.close());

    // Broadcast arbitrage rate updates
    this.arbitrageCalculator.on(
      EVENT_NAME,
      ({ pathId, pathDescription, rate }) => {
        this.webSocketManager?.broadcast({ pathId, pathDescription, rate });
      },
    );

    // Initialize event subscriber
    this.eventSubscriber = new EventSubscriber(
      this.dbManager,
      this.arbitrageCalculator,
    );
    this.cleanupCallbacks.push(async () => this.eventSubscriber?.shutdown());

    // Fetch initial pool reserves
    await this.eventSubscriber.fetchInitialPoolReserves();

    // Start listening for events
    console.log("Listening for Swap events...");
    await this.eventSubscriber.subscribeToPoolsInBatches();
  }

  /**
   * Performs cleanup of all application resources.
   * Executes all registered cleanup callbacks in parallel.
   *
   * @async
   * @returns {Promise<void>}
   */
  async cleanup() {
    console.log("Cleaning up resources...");
    await Promise.all(this.cleanupCallbacks.map((cb) => cb()));
  }
}
