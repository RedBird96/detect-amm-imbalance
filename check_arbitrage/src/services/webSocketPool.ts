import WebSocket from "ws";

/**
 * Configuration options for WebSocketPool.
 */
interface WebSocketPoolOptions {
  /** Maximum number of connections allowed per endpoint */
  maxConnections: number;
  /** Array of WebSocket endpoints to connect to */
  endpoints: string[];
}

/**
 * Manages a pool of WebSocket connections across multiple endpoints.
 * Implements connection pooling and load balancing across endpoints.
 */
class WebSocketPool {
  private pool: Map<string, WebSocket[]> = new Map();
  private maxConnections: number;
  private endpoints: string[];
  private endpointIndex: number = 0;

  /**
   * Creates a new WebSocketPool instance.
   *
   * @param {WebSocketPoolOptions} options - Configuration options for the pool
   */
  constructor(options: WebSocketPoolOptions) {
    this.maxConnections = options.maxConnections;
    this.endpoints = options.endpoints;

    // Initialize a pool for each endpoint
    this.endpoints.forEach((endpoint) => {
      this.pool.set(endpoint, []);
    });
  }

  /**
   * Gets the next endpoint in a round-robin fashion.
   *
   * @private
   * @returns {string} The next endpoint to use
   */
  private getNextEndpoint(): string {
    const endpoint = this.endpoints[this.endpointIndex];
    this.endpointIndex = (this.endpointIndex + 1) % this.endpoints.length;
    return endpoint;
  }

  /**
   * Creates a new WebSocket connection to the specified endpoint.
   * Sets up event handlers for connection lifecycle events.
   *
   * @param {string} endpoint - The WebSocket endpoint to connect to
   * @private
   * @returns {WebSocket} The newly created WebSocket connection
   */
  private createConnection(endpoint: string): WebSocket {
    const ws = new WebSocket(endpoint);

    ws.on("open", () => {
      console.log(`WebSocket connection established to ${endpoint}`);
    });

    ws.on("close", () => {
      console.log(`WebSocket connection closed for ${endpoint}`);
    });

    ws.on("error", (err) => {
      console.error(`WebSocket error for ${endpoint}:`, err);
    });

    return ws;
  }

  /**
   * Gets a WebSocket connection from the pool.
   * Creates a new connection if none are available and pool isn't full.
   *
   * @returns {WebSocket} A WebSocket connection
   * @throws {Error} If the pool is exhausted for the selected endpoint
   */
  public getConnection(): WebSocket {
    const endpoint = this.getNextEndpoint();
    const pool = this.pool.get(endpoint) || [];

    if (pool.length > 0) {
      return pool.pop()!;
    }

    if (pool.length < this.maxConnections) {
      const ws = this.createConnection(endpoint);
      return ws;
    }

    throw new Error(`WebSocket pool exhausted for endpoint: ${endpoint}`);
  }

  /**
   * Returns a WebSocket connection to the pool.
   * Closes the connection if the pool is full.
   *
   * @param {WebSocket} ws - The WebSocket connection to release
   * @param {string} endpoint - The endpoint the connection belongs to
   */
  public releaseConnection(ws: WebSocket, endpoint: string): void {
    const pool = this.pool.get(endpoint) || [];
    if (pool.length < this.maxConnections) {
      pool.push(ws);
      this.pool.set(endpoint, pool);
    } else {
      ws.close();
    }
  }

  /**
   * Closes all WebSocket connections in the pool.
   * Clears the pool after closing connections.
   */
  public closeAll(): void {
    this.pool.forEach((pool, endpoint) => {
      pool.forEach((ws) => ws.close());
    });
    this.pool.clear();
  }
}

export { WebSocketPool };
