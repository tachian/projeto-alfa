import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { ChannelModel } from "amqplib";
import type { Redis } from "ioredis";
import { beforeEach, describe, expect, it } from "vitest";
import { appConfig } from "../../config.js";
import { buildServer } from "../../server.js";
import type { AuthResult, LoginInput, RegisterInput } from "../auth/types.js";
import type { AuthServiceContract, CurrentUser } from "../auth/service.js";
import { AuthError } from "../auth/service.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../auth/tokens.js";
import type { CreateMarketInput, MarketAdminRecord, MarketAdminServiceContract, UpdateMarketInput } from "../markets/service.js";
import { MarketAdminError } from "../markets/service.js";
import type {
  ListPublicMarketsInput,
  MarketOrderBookRecord,
  MarketTradeRecord,
  PublicMarketRecord,
} from "../markets/public-service.js";
import { MarketCatalogError } from "../markets/public-service.js";
import type { CreateOrderInput, ListOrdersInput, ListOrdersResult, OrderRecord, OrderServiceContract } from "../orders/service.js";
import { OrderError } from "../orders/service.js";
import type { CreatePaymentInput, ListPaymentsInput, ListPaymentsResult, PaymentRecord, PaymentServiceContract } from "../payments/service.js";
import { PaymentError } from "../payments/service.js";
import type {
  PortfolioPnlSummary,
  PortfolioPositionRecord,
  PortfolioServiceContract,
  PortfolioSettlementRecord,
} from "../portfolio/service.js";
import type {
  CreateMarketResolutionInput,
  CreateSettlementRunInput,
  MarketResolutionRecord,
  SettlementRunRecord,
  SettlementServiceContract,
  UpdateSettlementRunInput,
} from "./service.js";
import { SettlementError } from "./service.js";
import type { WalletBalanceResult, WalletServiceContract, WalletStatementResult } from "../wallet/service.js";

const testDependenciesPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.decorate("appConfig", appConfig);
  fastify.decorate(
    "redis",
    {
      ping: async () => "PONG",
      quit: async () => "OK",
    } as unknown as Redis,
  );
  fastify.decorate(
    "amqp",
    {
      createChannel: async () =>
        ({
          close: async () => undefined,
        }) as unknown as Awaited<ReturnType<ChannelModel["createChannel"]>>,
      close: async () => undefined,
    } as unknown as ChannelModel,
  );
  fastify.decorate("dependencyHealth", {
    redis: "up",
    rabbitmq: "up",
  });
});

type UserState = CurrentUser & {
  password: string;
  refreshToken: string;
};

type PaymentState = PaymentRecord & {
  userUuid: string;
};

type PositionState = {
  uuid: string;
  userUuid: string;
  marketUuid: string;
  outcome: string;
  netQuantity: number;
  averageEntryPrice: number;
  realizedPnl: number;
  updatedAt: Date;
};

type SettlementState = PortfolioSettlementRecord & {
  userUuid: string;
};

type ExchangeState = {
  users: Map<string, UserState>;
  usersByEmail: Map<string, string>;
  balances: Map<string, { available: number; reserved: number }>;
  payments: PaymentState[];
  markets: Map<string, MarketAdminRecord>;
  orders: Map<string, OrderRecord>;
  trades: MarketTradeRecord[];
  positions: Map<string, PositionState>;
  resolutions: MarketResolutionRecord[];
  settlementRuns: SettlementRunRecord[];
  settlements: SettlementState[];
};

const makeState = (): ExchangeState => ({
  users: new Map(),
  usersByEmail: new Map(),
  balances: new Map(),
  payments: [],
  markets: new Map(),
  orders: new Map(),
  trades: [],
  positions: new Map(),
  resolutions: [],
  settlementRuns: [],
  settlements: [],
});

const positionKey = (userUuid: string, marketUuid: string, outcome: string) => `${userUuid}:${marketUuid}:${outcome}`;
const balanceKey = (userUuid: string) => `${userUuid}:USD`;
const roundMoney = (value: number) => Number(value.toFixed(4));
const money = (value: number) => roundMoney(value).toFixed(4);

const reserveAmount = (input: { side: string; price: number; quantity: number }) => {
  const cents = input.side === "buy" ? input.price : 100 - input.price;
  return roundMoney((cents * input.quantity) / 100);
};

const mapPublicMarket = (market: MarketAdminRecord): PublicMarketRecord => ({
  ...market,
  contractValue: market.contractValue,
});

const cloneOrder = (order: OrderRecord): OrderRecord => ({
  ...order,
  createdAt: new Date(order.createdAt),
  canceledAt: order.canceledAt ? new Date(order.canceledAt) : null,
  market: {
    ...order.market,
    closeAt: new Date(order.market.closeAt),
  },
});

class InMemoryExchange
  implements
    AuthServiceContract,
    MarketAdminServiceContract,
    OrderServiceContract,
    PaymentServiceContract,
    PortfolioServiceContract,
    SettlementServiceContract,
    WalletServiceContract
{
  constructor(private readonly state: ExchangeState) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    if (this.state.usersByEmail.has(input.email)) {
      throw new AuthError("Email ja cadastrado.", 409);
    }

    const uuid = crypto.randomUUID();
    const createdAt = new Date();
    const refreshToken = signRefreshToken({
      sub: uuid,
      jti: crypto.randomUUID(),
    });
    const user: UserState = {
      uuid,
      email: input.email,
      role: input.email === "admin@example.com" ? "admin" : "user",
      password: input.password,
      status: "active",
      createdAt,
      updatedAt: createdAt,
      refreshToken,
    };

    this.state.users.set(uuid, user);
    this.state.usersByEmail.set(input.email, uuid);
    this.state.balances.set(balanceKey(uuid), {
      available: 0,
      reserved: 0,
    });

    return {
      user,
      tokens: {
        accessToken: signAccessToken({
          sub: uuid,
          email: input.email,
        }),
        refreshToken,
        accessTokenExpiresIn: appConfig.JWT_EXPIRES_IN,
        refreshTokenExpiresIn: appConfig.JWT_REFRESH_EXPIRES_IN,
      },
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const userUuid = this.state.usersByEmail.get(input.email);
    const user = userUuid ? this.state.users.get(userUuid) : null;

    if (!user || user.password !== input.password) {
      throw new AuthError("Credenciais invalidas.", 401);
    }

    return {
      user,
      tokens: {
        accessToken: signAccessToken({
          sub: user.uuid,
          email: user.email,
        }),
        refreshToken: user.refreshToken,
        accessTokenExpiresIn: appConfig.JWT_EXPIRES_IN,
        refreshTokenExpiresIn: appConfig.JWT_REFRESH_EXPIRES_IN,
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    const payload = verifyRefreshToken(refreshToken);
    const user = this.state.users.get(payload.sub);

    if (!user || user.refreshToken !== refreshToken) {
      throw new AuthError("Refresh token invalido.", 401);
    }

    return {
      user,
      tokens: {
        accessToken: signAccessToken({
          sub: user.uuid,
          email: user.email,
        }),
        refreshToken: user.refreshToken,
        accessTokenExpiresIn: appConfig.JWT_EXPIRES_IN,
        refreshTokenExpiresIn: appConfig.JWT_REFRESH_EXPIRES_IN,
      },
    };
  }

  async getCurrentUser(userUuid: string): Promise<CurrentUser> {
    const user = this.state.users.get(userUuid);

    if (!user) {
      throw new AuthError("Usuario nao encontrado.", 404);
    }

    return user;
  }

  async createMarket(input: CreateMarketInput): Promise<MarketAdminRecord> {
    const uuid = crypto.randomUUID();
    const createdAt = new Date();
    const market: MarketAdminRecord = {
      uuid,
      slug: input.slug,
      title: input.title,
      category: input.category,
      status: input.status,
      outcomeType: input.outcomeType ?? "binary",
      contractValue: input.contractValue === undefined ? "1.00" : Number(input.contractValue).toFixed(2),
      tickSize: input.tickSize ?? 1,
      openAt: input.openAt ?? null,
      closeAt: input.closeAt,
      createdAt,
      updatedAt: createdAt,
      rules: {
        officialSourceLabel: input.officialSourceLabel,
        officialSourceUrl: input.officialSourceUrl,
        resolutionRules: input.resolutionRules,
        createdAt,
        updatedAt: createdAt,
      },
    };

    this.state.markets.set(uuid, market);
    return market;
  }

  async listMarkets(): Promise<MarketAdminRecord[]> {
    return Array.from(this.state.markets.values()).map((market) => ({
      ...market,
      closeAt: new Date(market.closeAt),
      openAt: market.openAt ? new Date(market.openAt) : null,
      createdAt: new Date(market.createdAt),
      updatedAt: new Date(market.updatedAt),
      rules: {
        ...market.rules,
        createdAt: new Date(market.rules.createdAt),
        updatedAt: new Date(market.rules.updatedAt),
      },
    }));
  }

  async getMarket(marketUuid: string): Promise<MarketAdminRecord> {
    const market = this.state.markets.get(marketUuid);

    if (!market) {
      throw new MarketAdminError("Mercado nao encontrado.", 404);
    }

    return (await this.listMarkets()).find((item) => item.uuid === marketUuid)!;
  }

  async updateMarket(input: UpdateMarketInput): Promise<MarketAdminRecord> {
    const market = this.state.markets.get(input.marketUuid);

    if (!market) {
      throw new MarketAdminError("Mercado nao encontrado.", 404);
    }

    const updatedAt = new Date();
    const nextMarket: MarketAdminRecord = {
      ...market,
      slug: input.slug ?? market.slug,
      title: input.title ?? market.title,
      category: input.category ?? market.category,
      status: input.status ?? market.status,
      outcomeType: input.outcomeType ?? market.outcomeType,
      contractValue: input.contractValue === undefined ? market.contractValue : Number(input.contractValue).toFixed(2),
      tickSize: input.tickSize ?? market.tickSize,
      openAt: input.openAt === undefined ? market.openAt : input.openAt,
      closeAt: input.closeAt ?? market.closeAt,
      updatedAt,
      rules: {
        officialSourceLabel: input.officialSourceLabel ?? market.rules.officialSourceLabel,
        officialSourceUrl: input.officialSourceUrl ?? market.rules.officialSourceUrl,
        resolutionRules: input.resolutionRules ?? market.rules.resolutionRules,
        createdAt: market.rules.createdAt,
        updatedAt,
      },
    };

    this.state.markets.set(input.marketUuid, nextMarket);
    return nextMarket;
  }

  async deleteMarket(marketUuid: string): Promise<void> {
    if (!this.state.markets.delete(marketUuid)) {
      throw new MarketAdminError("Mercado nao encontrado.", 404);
    }
  }

  async listPublicMarkets(input: ListPublicMarketsInput = {}): Promise<PublicMarketRecord[]> {
    return Array.from(this.state.markets.values())
      .filter((market) => !input.status || market.status === input.status)
      .filter((market) => !input.category || market.category === input.category)
      .filter((market) => !input.closeAtFrom || market.closeAt >= input.closeAtFrom)
      .filter((market) => !input.closeAtTo || market.closeAt <= input.closeAtTo)
      .map(mapPublicMarket);
  }

  async getMarketPublic(marketUuid: string): Promise<PublicMarketRecord> {
    const market = this.state.markets.get(marketUuid);

    if (!market) {
      throw new MarketCatalogError("Mercado nao encontrado.", 404);
    }

    return mapPublicMarket(market);
  }

  async getOrderBook(marketUuid: string): Promise<MarketOrderBookRecord> {
    const market = this.state.markets.get(marketUuid);

    if (!market) {
      throw new MarketCatalogError("Mercado nao encontrado.", 404);
    }

    const levels = new Map<string, MarketOrderBookRecord["levels"][number]>();

    for (const order of this.state.orders.values()) {
      if (order.marketUuid !== marketUuid || !["open", "partially_filled"].includes(order.status)) {
        continue;
      }

      const key = `${order.side}:${order.outcome}:${order.price}`;
      const current = levels.get(key);
      levels.set(key, {
        side: order.side,
        outcome: order.outcome,
        price: order.price,
        quantity: (current?.quantity ?? 0) + order.remainingQuantity,
        orderCount: (current?.orderCount ?? 0) + 1,
      });
    }

    return {
      marketUuid,
      marketStatus: market.status,
      levels: Array.from(levels.values()).sort((left, right) => right.price - left.price),
    };
  }

  async getTrades(marketUuid: string, input: { limit?: number } = {}): Promise<MarketTradeRecord[]> {
    if (!this.state.markets.has(marketUuid)) {
      throw new MarketCatalogError("Mercado nao encontrado.", 404);
    }

    return this.state.trades
      .filter((trade) => trade.marketUuid === marketUuid)
      .slice(0, input.limit ?? 20)
      .map((trade) => ({
        ...trade,
        executedAt: new Date(trade.executedAt),
      }));
  }

  async createDeposit(input: CreatePaymentInput): Promise<PaymentRecord> {
    return this.createPayment(input, "deposit");
  }

  async createWithdrawal(input: CreatePaymentInput): Promise<PaymentRecord> {
    return this.createPayment(input, "withdrawal");
  }

  async listPayments(input: ListPaymentsInput): Promise<ListPaymentsResult> {
    const currency = (input.currency ?? "USD").toUpperCase();
    const items = this.state.payments
      .filter((payment) => payment.userUuid === input.userUuid)
      .filter((payment) => payment.type === input.type && payment.currency === currency)
      .slice(0, input.limit ?? 50)
      .map(({ userUuid: _userUuid, ...payment }) => payment);

    return {
      items,
      meta: {
        count: items.length,
        limit: input.limit ?? 50,
        type: input.type,
        currency,
      },
    };
  }

  async createOrder(input: CreateOrderInput): Promise<OrderRecord> {
    const market = this.state.markets.get(input.marketUuid);

    if (!market) {
      throw new OrderError("Mercado nao encontrado.", 404);
    }

    if (market.status !== "open") {
      throw new OrderError("O mercado nao esta aberto para negociacao.", 400);
    }

    const balance = this.requireBalance(input.userUuid);
    const reserve = reserveAmount(input);

    if (balance.available < reserve) {
      throw new OrderError("Saldo insuficiente para reservar a ordem.", 400);
    }

    balance.available = roundMoney(balance.available - reserve);
    balance.reserved = roundMoney(balance.reserved + reserve);

    const createdAt = new Date();
    const order: OrderRecord = {
      uuid: crypto.randomUUID(),
      userUuid: input.userUuid,
      marketUuid: input.marketUuid,
      side: input.side,
      outcome: input.outcome,
      orderType: input.orderType ?? "limit",
      status: "open",
      price: input.price,
      quantity: input.quantity,
      remainingQuantity: input.quantity,
      createdAt,
      canceledAt: null,
      market: {
        uuid: market.uuid,
        slug: market.slug,
        title: market.title,
        status: market.status,
        closeAt: market.closeAt,
      },
    };

    this.state.orders.set(order.uuid, order);

    const matches = Array.from(this.state.orders.values())
      .filter((candidate) => candidate.uuid !== order.uuid)
      .filter((candidate) => candidate.marketUuid === input.marketUuid)
      .filter((candidate) => candidate.outcome === input.outcome)
      .filter((candidate) => candidate.side === (input.side === "buy" ? "sell" : "buy"))
      .filter((candidate) => ["open", "partially_filled"].includes(candidate.status))
      .filter((candidate) => candidate.userUuid !== input.userUuid)
      .filter((candidate) => (input.side === "buy" ? candidate.price <= input.price : candidate.price >= input.price))
      .sort((left, right) => {
        if (input.side === "buy") {
          return left.price - right.price || left.createdAt.getTime() - right.createdAt.getTime();
        }

        return right.price - left.price || left.createdAt.getTime() - right.createdAt.getTime();
      });

    let currentOrder = order;

    for (const resting of matches) {
      if (currentOrder.remainingQuantity === 0) {
        break;
      }

      const tradeQuantity = Math.min(currentOrder.remainingQuantity, resting.remainingQuantity);
      const tradePrice = resting.price;
      const buyerOrder = currentOrder.side === "buy" ? currentOrder : resting;
      const sellerOrder = currentOrder.side === "sell" ? currentOrder : resting;
      const buyerTradeCost = reserveAmount({
        side: "buy",
        price: tradePrice,
        quantity: tradeQuantity,
      });
      const sellerTradeCost = reserveAmount({
        side: "sell",
        price: tradePrice,
        quantity: tradeQuantity,
      });
      const buyerReservedAtLimit = reserveAmount({
        side: "buy",
        price: buyerOrder.price,
        quantity: tradeQuantity,
      });
      const sellerReservedAtLimit = reserveAmount({
        side: "sell",
        price: sellerOrder.price,
        quantity: tradeQuantity,
      });

      const buyerBalance = this.requireBalance(buyerOrder.userUuid);
      const sellerBalance = this.requireBalance(sellerOrder.userUuid);

      buyerBalance.reserved = roundMoney(buyerBalance.reserved - buyerReservedAtLimit);
      sellerBalance.reserved = roundMoney(sellerBalance.reserved - sellerReservedAtLimit);

      if (buyerReservedAtLimit > buyerTradeCost) {
        buyerBalance.available = roundMoney(buyerBalance.available + (buyerReservedAtLimit - buyerTradeCost));
      }

      if (sellerReservedAtLimit > sellerTradeCost) {
        sellerBalance.available = roundMoney(sellerBalance.available + (sellerReservedAtLimit - sellerTradeCost));
      }

      currentOrder.remainingQuantity -= tradeQuantity;
      currentOrder.status = currentOrder.remainingQuantity === 0 ? "filled" : "partially_filled";
      resting.remainingQuantity -= tradeQuantity;
      resting.status = resting.remainingQuantity === 0 ? "filled" : "partially_filled";

      this.state.orders.set(currentOrder.uuid, currentOrder);
      this.state.orders.set(resting.uuid, resting);

      const trade: MarketTradeRecord = {
        uuid: crypto.randomUUID(),
        marketUuid: input.marketUuid,
        buyOrderUuid: buyerOrder.uuid,
        sellOrderUuid: sellerOrder.uuid,
        price: tradePrice,
        quantity: tradeQuantity,
        executedAt: new Date(),
      };
      this.state.trades.unshift(trade);

      this.applyTradeToPosition(buyerOrder.userUuid, input.marketUuid, input.outcome, tradeQuantity, tradePrice);
      this.applyTradeToPosition(sellerOrder.userUuid, input.marketUuid, input.outcome, -tradeQuantity, tradePrice);
    }

    return cloneOrder(currentOrder);
  }

  async listOrders(input: ListOrdersInput): Promise<ListOrdersResult> {
    const limit = input.limit ?? 50;
    const items = Array.from(this.state.orders.values())
      .filter((order) => order.userUuid === input.userUuid)
      .filter((order) => !input.marketUuid || order.marketUuid === input.marketUuid)
      .filter((order) => !input.status || order.status === input.status)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, limit)
      .map(cloneOrder);

    return {
      items,
      meta: {
        count: items.length,
        limit,
      },
    };
  }

  async cancelOrder(input: { userUuid: string; orderUuid: string }): Promise<OrderRecord> {
    const order = this.state.orders.get(input.orderUuid);

    if (!order || order.userUuid !== input.userUuid) {
      throw new OrderError("Ordem nao encontrada.", 404);
    }

    if (!["open", "partially_filled"].includes(order.status)) {
      throw new OrderError("A ordem nao pode ser cancelada neste estado.", 400);
    }

    const balance = this.requireBalance(input.userUuid);
    const releaseAmount = reserveAmount({
      side: order.side,
      price: order.price,
      quantity: order.remainingQuantity,
    });

    balance.reserved = roundMoney(balance.reserved - releaseAmount);
    balance.available = roundMoney(balance.available + releaseAmount);
    order.status = "cancelled";
    order.canceledAt = new Date();
    this.state.orders.set(order.uuid, order);

    return cloneOrder(order);
  }

  async listPositions(input: { userUuid: string; limit?: number }): Promise<PortfolioPositionRecord[]> {
    const positions = Array.from(this.state.positions.values())
      .filter((position) => position.userUuid === input.userUuid)
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
      .slice(0, input.limit ?? 100);

    return positions.map((position) => {
      const latestTrade = this.state.trades.find((trade) => trade.marketUuid === position.marketUuid);
      const markPrice = latestTrade ? latestTrade.price : position.averageEntryPrice;
      const unrealizedPnl = roundMoney(((markPrice - position.averageEntryPrice) * position.netQuantity) / 100);
      const totalPnl = roundMoney(position.realizedPnl + unrealizedPnl);
      const market = this.state.markets.get(position.marketUuid)!;

      return {
        uuid: position.uuid,
        userUuid: position.userUuid,
        marketUuid: position.marketUuid,
        outcome: position.outcome,
        netQuantity: position.netQuantity,
        averageEntryPrice: money(position.averageEntryPrice),
        markPrice: money(markPrice),
        realizedPnl: money(position.realizedPnl),
        unrealizedPnl: money(unrealizedPnl),
        totalPnl: money(totalPnl),
        market: {
          uuid: market.uuid,
          slug: market.slug,
          title: market.title,
          status: market.status,
          closeAt: market.closeAt,
        },
        updatedAt: position.updatedAt,
      };
    });
  }

  async getPnlSummary(userUuid: string): Promise<PortfolioPnlSummary> {
    const positions = await this.listPositions({ userUuid });
    const realizedPnl = positions.reduce((total, position) => total + Number(position.realizedPnl), 0);
    const unrealizedPnl = positions.reduce((total, position) => total + Number(position.unrealizedPnl), 0);

    return {
      realizedPnl: money(realizedPnl),
      unrealizedPnl: money(unrealizedPnl),
      totalPnl: money(realizedPnl + unrealizedPnl),
      openPositions: positions.filter((position) => position.netQuantity !== 0).length,
    };
  }

  async listSettlements(input: { userUuid: string; limit?: number }): Promise<PortfolioSettlementRecord[]> {
    return this.state.settlements
      .filter((settlement) => settlement.userUuid === input.userUuid)
      .slice(0, input.limit ?? 100)
      .map(({ userUuid: _userUuid, ...settlement }) => settlement);
  }

  async createMarketResolution(input: CreateMarketResolutionInput): Promise<MarketResolutionRecord> {
    if (!this.state.markets.has(input.marketUuid)) {
      throw new SettlementError("Mercado nao encontrado para resolucao.", 404);
    }

    const resolution: MarketResolutionRecord = {
      uuid: crypto.randomUUID(),
      marketUuid: input.marketUuid,
      winningOutcome: input.winningOutcome ?? null,
      sourceValue: input.sourceValue ?? null,
      status: input.status,
      notes: input.notes ?? null,
      resolvedByUserUuid: input.resolvedByUserUuid ?? null,
      resolvedAt: input.resolvedAt ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.state.resolutions.unshift(resolution);

    const market = this.state.markets.get(input.marketUuid)!;
    market.status = input.status === "resolved" ? "resolved" : input.status === "cancelled" ? "cancelled" : "resolving";
    market.updatedAt = new Date();
    this.state.markets.set(market.uuid, market);

    return resolution;
  }

  async listMarketResolutions(marketUuid: string): Promise<MarketResolutionRecord[]> {
    return this.state.resolutions
      .filter((resolution) => resolution.marketUuid === marketUuid)
      .map((resolution) => ({
        ...resolution,
        createdAt: new Date(resolution.createdAt),
        updatedAt: new Date(resolution.updatedAt),
        resolvedAt: resolution.resolvedAt ? new Date(resolution.resolvedAt) : null,
      }));
  }

  async createSettlementRun(input: CreateSettlementRunInput): Promise<SettlementRunRecord> {
    const run: SettlementRunRecord = {
      uuid: crypto.randomUUID(),
      marketUuid: input.marketUuid,
      marketResolutionUuid: input.marketResolutionUuid,
      status: input.status ?? "pending",
      contractsProcessed: input.contractsProcessed ?? 0,
      totalPayout: input.totalPayout === undefined ? "0.0000" : money(Number(input.totalPayout)),
      metadata: (input.metadata ?? null) as SettlementRunRecord["metadata"],
      startedAt: input.startedAt ?? new Date(),
      finishedAt: input.finishedAt ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.state.settlementRuns.unshift(run);
    return run;
  }

  async updateSettlementRun(input: UpdateSettlementRunInput): Promise<SettlementRunRecord> {
    const run = this.state.settlementRuns.find((item) => item.uuid === input.settlementRunUuid);

    if (!run) {
      throw new SettlementError("Settlement run nao encontrado.", 404);
    }

    run.status = input.status ?? run.status;
    run.contractsProcessed = input.contractsProcessed ?? run.contractsProcessed;
    run.totalPayout = input.totalPayout === undefined ? run.totalPayout : money(Number(input.totalPayout));
    run.metadata = (input.metadata ?? run.metadata) as SettlementRunRecord["metadata"];
    run.finishedAt = input.finishedAt === undefined ? run.finishedAt : input.finishedAt;
    run.updatedAt = new Date();

    return {
      ...run,
    };
  }

  async listSettlementRuns(marketUuid: string): Promise<SettlementRunRecord[]> {
    return this.state.settlementRuns.filter((run) => run.marketUuid === marketUuid).map((run) => ({ ...run }));
  }

  async executeSettlementRun(input: { settlementRunUuid: string; executedByUserUuid?: string | null }): Promise<SettlementRunRecord> {
    const run = this.state.settlementRuns.find((item) => item.uuid === input.settlementRunUuid);

    if (!run) {
      throw new SettlementError("Settlement run nao encontrado.", 404);
    }

    const resolution = this.state.resolutions.find((item) => item.uuid === run.marketResolutionUuid);

    if (!resolution || resolution.status !== "resolved" || !resolution.winningOutcome) {
      throw new SettlementError("A resolucao precisa estar marcada como resolved com resultado vencedor.", 400);
    }

    const contractValue = 1;
    let totalPayout = 0;
    let contractsProcessed = 0;

    for (const position of this.state.positions.values()) {
      if (position.marketUuid !== run.marketUuid || position.netQuantity === 0) {
        continue;
      }

      contractsProcessed += Math.abs(position.netQuantity);
      const quantity = Math.abs(position.netQuantity);
      const contractSettlesAt = position.outcome === resolution.winningOutcome ? 100 : 0;
      const settlementPnl =
        position.netQuantity > 0
          ? ((contractSettlesAt - position.averageEntryPrice) * quantity) / 100
          : ((position.averageEntryPrice - contractSettlesAt) * quantity) / 100;
      const isWinningPosition =
        (position.netQuantity > 0 && position.outcome === resolution.winningOutcome) ||
        (position.netQuantity < 0 && position.outcome !== resolution.winningOutcome);
      const payoutAmount = isWinningPosition ? contractValue * quantity : 0;

      if (isWinningPosition) {
        const balance = this.requireBalance(position.userUuid);
        balance.available = roundMoney(balance.available + payoutAmount);
        totalPayout = roundMoney(totalPayout + payoutAmount);
      }

      const market = this.state.markets.get(position.marketUuid)!;
      this.state.settlements.unshift({
        uuid: crypto.randomUUID(),
        userUuid: position.userUuid,
        settlementRunUuid: run.uuid,
        marketUuid: run.marketUuid,
        outcome: position.outcome,
        winningOutcome: resolution.winningOutcome,
        positionDirection: position.netQuantity > 0 ? "long" : "short",
        contractsSettled: quantity,
        payoutAmount: money(payoutAmount),
        realizedPnlDelta: money(settlementPnl),
        status: isWinningPosition ? "won" : "lost",
        createdAt: new Date(),
        market: {
          uuid: market.uuid,
          slug: market.slug,
          title: market.title,
          status: market.status,
          closeAt: market.closeAt,
        },
      });

      position.realizedPnl = roundMoney(position.realizedPnl + settlementPnl);
      position.netQuantity = 0;
      position.averageEntryPrice = 0;
      position.updatedAt = new Date();
      this.state.positions.set(positionKey(position.userUuid, position.marketUuid, position.outcome), position);
    }

    run.status = "completed";
    run.contractsProcessed = contractsProcessed;
    run.totalPayout = money(totalPayout);
    run.metadata = {
      ...(run.metadata && typeof run.metadata === "object" && !Array.isArray(run.metadata) ? run.metadata : {}),
      executedByUserUuid: input.executedByUserUuid ?? null,
      winningOutcome: resolution.winningOutcome,
    };
    run.finishedAt = new Date();
    run.updatedAt = new Date();

    return {
      ...run,
    };
  }

  async getBalance(userUuid: string): Promise<WalletBalanceResult> {
    const balance = this.requireBalance(userUuid);

    return {
      currency: "USD",
      available: money(balance.available),
      reserved: money(balance.reserved),
      total: money(balance.available + balance.reserved),
      accounts: {
        available: {
          uuid: `${userUuid}-available`,
          balance: money(balance.available),
        },
        reserved: {
          uuid: `${userUuid}-reserved`,
          balance: money(balance.reserved),
        },
      },
    };
  }

  async getStatement(_input: { userUuid: string; currency?: string; limit?: number }): Promise<WalletStatementResult> {
    return {
      entries: [],
      meta: {
        count: 0,
        limit: 50,
        currency: "USD",
      },
    };
  }

  private async createPayment(input: CreatePaymentInput, type: "deposit" | "withdrawal"): Promise<PaymentRecord> {
    const user = this.state.users.get(input.userUuid);

    if (!user) {
      throw new PaymentError("Usuario nao encontrado.", 404);
    }

    const amount = roundMoney(Number(input.amount));
    const balance = this.requireBalance(input.userUuid);

    if (type === "withdrawal" && balance.available < amount) {
      throw new PaymentError("Saldo insuficiente para saque.", 400);
    }

    balance.available = roundMoney(balance.available + (type === "deposit" ? amount : -amount));

    const payment: PaymentState = {
      uuid: crypto.randomUUID(),
      userUuid: input.userUuid,
      type,
      status: "completed",
      provider: "manual",
      amount: money(amount),
      currency: (input.currency ?? "USD").toUpperCase(),
      description: input.description ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
      ledgerTransactionUuid: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: new Date(),
      metadata: input.metadata ?? null,
    };

    this.state.payments.unshift(payment);
    return payment;
  }

  private requireBalance(userUuid: string) {
    const balance = this.state.balances.get(balanceKey(userUuid));

    if (!balance) {
      throw new Error(`Balance not found for user ${userUuid}`);
    }

    return balance;
  }

  private applyTradeToPosition(
    userUuid: string,
    marketUuid: string,
    outcome: string,
    quantityDelta: number,
    executionPrice: number,
  ) {
    const key = positionKey(userUuid, marketUuid, outcome);
    const existing = this.state.positions.get(key) ?? {
      uuid: crypto.randomUUID(),
      userUuid,
      marketUuid,
      outcome,
      netQuantity: 0,
      averageEntryPrice: 0,
      realizedPnl: 0,
      updatedAt: new Date(),
    };

    const nextQuantity = existing.netQuantity + quantityDelta;

    if (existing.netQuantity === 0 || Math.sign(existing.netQuantity) === Math.sign(quantityDelta)) {
      const weightedCost =
        Math.abs(existing.netQuantity) * existing.averageEntryPrice + Math.abs(quantityDelta) * executionPrice;
      existing.netQuantity = nextQuantity;
      existing.averageEntryPrice = nextQuantity === 0 ? 0 : roundMoney(weightedCost / Math.abs(nextQuantity));
    } else {
      const closedQuantity = Math.min(Math.abs(existing.netQuantity), Math.abs(quantityDelta));
      const realizedDelta =
        existing.netQuantity > 0
          ? ((executionPrice - existing.averageEntryPrice) * closedQuantity) / 100
          : ((existing.averageEntryPrice - executionPrice) * closedQuantity) / 100;

      existing.realizedPnl = roundMoney(existing.realizedPnl + realizedDelta);
      existing.netQuantity = nextQuantity;

      if (nextQuantity === 0) {
        existing.averageEntryPrice = 0;
      } else if (Math.sign(nextQuantity) === Math.sign(quantityDelta)) {
        existing.averageEntryPrice = executionPrice;
      }
    }

    existing.updatedAt = new Date();
    this.state.positions.set(key, existing);
  }
}

describe("settlement sprint 5 e2e", () => {
  let exchange: InMemoryExchange;

  beforeEach(() => {
    exchange = new InMemoryExchange(makeState());
  });

  it("runs the full lifecycle from deposit to order to trade to resolution and payout", async () => {
    const server = await buildServer({
      dependenciesPlugin: testDependenciesPlugin,
      authService: exchange,
      marketAdminService: exchange,
      marketCatalogService: {
        listMarkets: exchange.listPublicMarkets.bind(exchange),
        getMarket: exchange.getMarketPublic.bind(exchange),
        getOrderBook: exchange.getOrderBook.bind(exchange),
        getTrades: exchange.getTrades.bind(exchange),
      },
      orderService: exchange,
      paymentService: exchange,
      portfolioService: exchange,
      settlementService: exchange,
      walletService: exchange,
    });

    try {
      const password = "teste123456";

      const buyerRegisterResponse = await server.inject({
        method: "POST",
        url: "/auth/register",
        payload: {
          email: "buyer@example.com",
          password,
        },
      });
      expect(buyerRegisterResponse.statusCode).toBe(201);
      const buyerToken = buyerRegisterResponse.json().tokens.accessToken as string;

      const sellerRegisterResponse = await server.inject({
        method: "POST",
        url: "/auth/register",
        payload: {
          email: "seller@example.com",
          password,
        },
      });
      expect(sellerRegisterResponse.statusCode).toBe(201);
      const sellerToken = sellerRegisterResponse.json().tokens.accessToken as string;

      const adminRegisterResponse = await server.inject({
        method: "POST",
        url: "/auth/register",
        payload: {
          email: "admin@example.com",
          password,
        },
      });
      expect(adminRegisterResponse.statusCode).toBe(201);
      const adminToken = adminRegisterResponse.json().tokens.accessToken as string;

      const buyerDepositResponse = await server.inject({
        method: "POST",
        url: "/payments/deposits",
        headers: {
          authorization: `Bearer ${buyerToken}`,
          "idempotency-key": "buyer-deposit-1",
        },
        payload: {
          amount: "10.00",
          currency: "USD",
        },
      });
      expect(buyerDepositResponse.statusCode).toBe(201);

      const sellerDepositResponse = await server.inject({
        method: "POST",
        url: "/payments/deposits",
        headers: {
          authorization: `Bearer ${sellerToken}`,
          "idempotency-key": "seller-deposit-1",
        },
        payload: {
          amount: "10.00",
          currency: "USD",
        },
      });
      expect(sellerDepositResponse.statusCode).toBe(201);

      const marketResponse = await server.inject({
        method: "POST",
        url: "/admin/markets",
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          slug: "btc-above-100k-december",
          title: "BTC fecha acima de 100k em dezembro",
          category: "crypto",
          status: "open",
          closeAt: "2099-12-31T23:59:59.000Z",
          officialSourceLabel: "Coinbase spot price",
          officialSourceUrl: "https://www.coinbase.com/",
          resolutionRules: "Resolve YES if BTC closes above 100k.",
        },
      });
      expect(marketResponse.statusCode).toBe(201);
      const marketUuid = marketResponse.json().market.uuid as string;

      const buyOrderResponse = await server.inject({
        method: "POST",
        url: "/orders",
        headers: {
          authorization: `Bearer ${buyerToken}`,
        },
        payload: {
          marketUuid,
          side: "buy",
          outcome: "YES",
          price: 55,
          quantity: 10,
        },
      });
      expect(buyOrderResponse.statusCode).toBe(201);
      expect(buyOrderResponse.json()).toMatchObject({
        order: {
          marketUuid,
          status: "open",
          remainingQuantity: 10,
        },
      });

      const sellOrderResponse = await server.inject({
        method: "POST",
        url: "/orders",
        headers: {
          authorization: `Bearer ${sellerToken}`,
        },
        payload: {
          marketUuid,
          side: "sell",
          outcome: "YES",
          price: 55,
          quantity: 10,
        },
      });
      expect(sellOrderResponse.statusCode).toBe(201);
      expect(sellOrderResponse.json()).toMatchObject({
        order: {
          marketUuid,
          status: "filled",
          remainingQuantity: 0,
        },
      });

      const tradesResponse = await server.inject({
        method: "GET",
        url: `/markets/${marketUuid}/trades?limit=20`,
      });
      expect(tradesResponse.statusCode).toBe(200);
      expect(tradesResponse.json()).toMatchObject({
        items: [
          {
            marketUuid,
            price: 55,
            quantity: 10,
          },
        ],
      });

      const buyerBalanceAfterTradeResponse = await server.inject({
        method: "GET",
        url: "/wallet/balance",
        headers: {
          authorization: `Bearer ${buyerToken}`,
        },
      });
      expect(buyerBalanceAfterTradeResponse.statusCode).toBe(200);
      expect(buyerBalanceAfterTradeResponse.json()).toMatchObject({
        balance: {
          available: "4.5000",
          reserved: "0.0000",
          total: "4.5000",
        },
      });

      const buyerPositionsAfterTradeResponse = await server.inject({
        method: "GET",
        url: "/portfolio/positions?limit=20",
        headers: {
          authorization: `Bearer ${buyerToken}`,
        },
      });
      expect(buyerPositionsAfterTradeResponse.statusCode).toBe(200);
      expect(buyerPositionsAfterTradeResponse.json()).toMatchObject({
        items: [
          {
            marketUuid,
            outcome: "YES",
            netQuantity: 10,
            averageEntryPrice: "55.0000",
            realizedPnl: "0.0000",
            unrealizedPnl: "0.0000",
            totalPnl: "0.0000",
          },
        ],
      });

      const resolutionResponse = await server.inject({
        method: "POST",
        url: `/admin/markets/${marketUuid}/resolutions`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          winningOutcome: "YES",
          sourceValue: "BTC closed at 104500",
          status: "resolved",
        },
      });
      expect(resolutionResponse.statusCode).toBe(201);
      const marketResolutionUuid = resolutionResponse.json().resolution.uuid as string;

      const settlementRunResponse = await server.inject({
        method: "POST",
        url: `/admin/markets/${marketUuid}/settlement-runs`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          marketResolutionUuid,
          status: "pending",
        },
      });
      expect(settlementRunResponse.statusCode).toBe(201);
      const settlementRunUuid = settlementRunResponse.json().settlementRun.uuid as string;

      const executeSettlementResponse = await server.inject({
        method: "POST",
        url: `/admin/settlement-runs/${settlementRunUuid}/execute`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });
      expect(executeSettlementResponse.statusCode).toBe(200);
      expect(executeSettlementResponse.json()).toMatchObject({
        settlementRun: {
          uuid: settlementRunUuid,
          marketUuid,
          status: "completed",
          contractsProcessed: 20,
          totalPayout: "10.0000",
        },
      });

      const buyerBalanceAfterPayoutResponse = await server.inject({
        method: "GET",
        url: "/wallet/balance",
        headers: {
          authorization: `Bearer ${buyerToken}`,
        },
      });
      expect(buyerBalanceAfterPayoutResponse.statusCode).toBe(200);
      expect(buyerBalanceAfterPayoutResponse.json()).toMatchObject({
        balance: {
          available: "14.5000",
          reserved: "0.0000",
          total: "14.5000",
        },
      });

      const buyerPnlResponse = await server.inject({
        method: "GET",
        url: "/portfolio/pnl",
        headers: {
          authorization: `Bearer ${buyerToken}`,
        },
      });
      expect(buyerPnlResponse.statusCode).toBe(200);
      expect(buyerPnlResponse.json()).toMatchObject({
        summary: {
          realizedPnl: "4.5000",
          unrealizedPnl: "0.0000",
          totalPnl: "4.5000",
          openPositions: 0,
        },
      });

      const buyerSettlementHistoryResponse = await server.inject({
        method: "GET",
        url: "/portfolio/settlements?limit=20",
        headers: {
          authorization: `Bearer ${buyerToken}`,
        },
      });
      expect(buyerSettlementHistoryResponse.statusCode).toBe(200);
      expect(buyerSettlementHistoryResponse.json()).toMatchObject({
        items: [
          {
            settlementRunUuid,
            marketUuid,
            outcome: "YES",
            winningOutcome: "YES",
            positionDirection: "long",
            contractsSettled: 10,
            payoutAmount: "10.0000",
            realizedPnlDelta: "4.5000",
            status: "won",
          },
        ],
      });
    } finally {
      await server.close();
    }
  });
});
