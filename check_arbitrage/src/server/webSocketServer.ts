/**
 * WebSocket server implementation for real-time arbitrage opportunity broadcasting.
 * This class manages WebSocket connections and broadcasts arbitrage opportunities
 * to all connected clients in real-time.
 * 
 * Features:
 * - Real-time data broadcasting
 * - Connection state management
 * - Graceful server shutdown
 * 
 * @class WebSocketManager
 */

import { WebSocketServer, WebSocket } from "ws";
import { EVENT_NAME } from "../config/constants";

export class WebSocketManager {
  /** WebSocket server instance */
  private wss: WebSocketServer;

  /**
   * Creates a new WebSocket server instance.
   * Initializes the server on the specified port and logs the server URL.
   * 
   * @param {number} port - Port number to start the WebSocket server on
   */
  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    console.log(`WebSocket server started on ws://localhost:${port}`);
  }

  /**
   * Broadcasts an arbitrage opportunity to all connected clients.
   * Only sends to clients with OPEN connection state.
   * 
   * @param {Object} message - The arbitrage opportunity data
   * @param {string} message.pathId - Unique identifier for the arbitrage path
   * @param {string} message.pathDescription - Human-readable path description
   * @param {number} message.rate - Profit rate in ETH
   */
  broadcast(message: {
    pathId: string;
    pathDescription: string;
    rate: number;
  }) {
    // console.log("message", message);
    const data = JSON.stringify({ type: EVENT_NAME, ...message });
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  /**
   * Closes the WebSocket server and all client connections.
   * Should be called during application shutdown.
   */
  close() {
    this.wss.close();
    console.log("WebSocket server closed.");
  }
}
