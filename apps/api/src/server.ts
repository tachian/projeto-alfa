import Fastify from "fastify";
import type { FastifyPluginAsync } from "fastify";
import { appConfig } from "./config.js";
import { buildAuthRoutes } from "./modules/auth/routes.js";
import type { AuthServiceContract } from "./modules/auth/service.js";
import { buildMarketCatalogRoutes } from "./modules/markets/public-routes.js";
import type { MarketCatalogServiceContract } from "./modules/markets/public-service.js";
import { buildMarketAdminRoutes } from "./modules/markets/routes.js";
import type { MarketAdminServiceContract } from "./modules/markets/service.js";
import { buildOrderRoutes } from "./modules/orders/routes.js";
import type { OrderServiceContract } from "./modules/orders/service.js";
import { buildPaymentRoutes } from "./modules/payments/routes.js";
import type { PaymentServiceContract } from "./modules/payments/service.js";
import { realtimeHub } from "./modules/realtime/hub.js";
import { buildWalletRoutes } from "./modules/wallet/routes.js";
import type { WalletServiceContract } from "./modules/wallet/service.js";
import { dependenciesPluginRegistered } from "./plugins/dependencies.js";
import { observabilityPluginRegistered } from "./plugins/observability.js";
import { healthRoutes } from "./routes/health.js";

type BuildServerOptions = {
  dependenciesPlugin?: FastifyPluginAsync;
  authService?: AuthServiceContract;
  marketCatalogService?: MarketCatalogServiceContract;
  marketAdminService?: MarketAdminServiceContract;
  orderService?: OrderServiceContract;
  paymentService?: PaymentServiceContract;
  walletService?: WalletServiceContract;
};

export const buildServer = async (options: BuildServerOptions = {}) => {
  const server = Fastify({
    logger: {
      level: appConfig.LOG_LEVEL,
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "response.tokens.accessToken",
          "response.tokens.refreshToken",
        ],
        censor: "[REDACTED]",
      },
    },
    disableRequestLogging: true,
  });

  await server.register(observabilityPluginRegistered);
  await server.register(options.dependenciesPlugin ?? dependenciesPluginRegistered);
  await server.register(healthRoutes);
  await server.register(buildMarketCatalogRoutes(options.marketCatalogService));
  await server.register(buildAuthRoutes(options.authService));
  await server.register(buildMarketAdminRoutes(options.marketAdminService, options.authService));
  await server.register(buildOrderRoutes(options.orderService, options.authService));
  await server.register(buildPaymentRoutes(options.paymentService, options.authService));
  await server.register(buildWalletRoutes(options.walletService, options.authService));
  realtimeHub.attach(server.server);

  server.get("/", async () => {
    return {
      service: appConfig.APP_NAME,
      status: "ok",
      docs: {
        liveness: "/health/live",
        readiness: "/health/ready",
        realtime: "/realtime",
      },
    };
  });

  return server;
};
