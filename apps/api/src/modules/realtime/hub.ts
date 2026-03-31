import type { IncomingMessage } from "node:http";
import type { Socket } from "node:net";
import type { Server as HttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";

type RealtimeMessage =
  | {
      type: "connected";
    }
  | {
      type: "subscribed";
      channel: string;
    }
  | {
      type: "unsubscribed";
      channel: string;
    }
  | {
      type: "event";
      channel: string;
      payload: unknown;
    }
  | {
      type: "error";
      message: string;
    };

type SubscriptionCommand = {
  action: "subscribe" | "unsubscribe";
  channel: string;
};

const toJson = (message: RealtimeMessage) => JSON.stringify(message);

export class RealtimeHub {
  private readonly subscriptions = new Map<string, Set<WebSocket>>();
  private readonly attachedServers = new WeakSet<HttpServer>();
  private readonly webSocketServer = new WebSocketServer({ noServer: true });

  constructor() {
    this.webSocketServer.on("connection", (socket: WebSocket) => {
      socket.send(toJson({ type: "connected" }));

      socket.on("message", (buffer: Buffer) => {
        try {
          const command = JSON.parse(buffer.toString()) as SubscriptionCommand;

          if (!command.channel || (command.action !== "subscribe" && command.action !== "unsubscribe")) {
            socket.send(toJson({ type: "error", message: "Comando invalido." }));
            return;
          }

          if (command.action === "subscribe") {
            this.subscribe(command.channel, socket);
            socket.send(toJson({ type: "subscribed", channel: command.channel }));
            return;
          }

          this.unsubscribe(command.channel, socket);
          socket.send(toJson({ type: "unsubscribed", channel: command.channel }));
        } catch {
          socket.send(toJson({ type: "error", message: "Payload invalido." }));
        }
      });

      socket.on("close", () => {
        this.removeSocket(socket);
      });
    });
  }

  attach(server: HttpServer) {
    if (this.attachedServers.has(server)) {
      return;
    }

    this.attachedServers.add(server);
    server.on("upgrade", (request: IncomingMessage, socket: Socket, head: Buffer) => {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");

      if (requestUrl.pathname !== "/realtime") {
        socket.destroy();
        return;
      }

      this.webSocketServer.handleUpgrade(request, socket, head, (webSocket: WebSocket) => {
        this.webSocketServer.emit("connection", webSocket, request);
      });
    });
  }

  publish(channel: string, payload: unknown) {
    const channelSubscribers = this.subscriptions.get(channel);

    if (!channelSubscribers?.size) {
      return;
    }

    const message = toJson({
      type: "event",
      channel,
      payload,
    });

    for (const socket of channelSubscribers) {
      if (socket.readyState !== WebSocket.OPEN) {
        channelSubscribers.delete(socket);
        continue;
      }

      socket.send(message);
    }
  }

  subscribe(channel: string, socket: WebSocket) {
    const current = this.subscriptions.get(channel) ?? new Set<WebSocket>();
    current.add(socket);
    this.subscriptions.set(channel, current);
  }

  unsubscribe(channel: string, socket: WebSocket) {
    const current = this.subscriptions.get(channel);

    if (!current) {
      return;
    }

    current.delete(socket);

    if (current.size === 0) {
      this.subscriptions.delete(channel);
    }
  }

  private removeSocket(socket: WebSocket) {
    for (const [channel, sockets] of this.subscriptions.entries()) {
      sockets.delete(socket);

      if (sockets.size === 0) {
        this.subscriptions.delete(channel);
      }
    }
  }
}

export const realtimeHub = new RealtimeHub();
