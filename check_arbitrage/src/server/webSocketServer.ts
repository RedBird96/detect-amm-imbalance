import { WebSocketServer, WebSocket } from "ws";
import { EVENT_NAME } from "../config/constants";

export class WebSocketManager {
  private wss: WebSocketServer;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    console.log(`WebSocket server started on ws://localhost:${port}`);
  }

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

  close() {
    this.wss.close();
    console.log("WebSocket server closed.");
  }
}
