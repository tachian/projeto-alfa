import { buildServer } from "./server.js";

const server = await buildServer();

const address = await server.listen({
  host: server.appConfig.HOST,
  port: server.appConfig.PORT,
});

server.log.info({ address }, "api server listening");

const shutdown = async (signal: string) => {
  server.log.info({ signal }, "shutdown signal received");
  await server.close();
  process.exit(0);
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
