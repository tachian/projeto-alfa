import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 100;
const ORDER_SIDES = ["buy", "sell"] as const;
const ORDER_OUTCOMES = ["YES", "NO"] as const;
const ORDER_TYPES = ["limit"] as const;
const CANCELABLE_ORDER_STATUSES = ["open", "partially_filled"] as const;

export type OrderRecord = {
  uuid: string;
  userUuid: string;
  marketUuid: string;
  side: string;
  outcome: string;
  orderType: string;
  status: string;
  price: number;
  quantity: number;
  remainingQuantity: number;
  createdAt: Date;
  canceledAt: Date | null;
  market: {
    uuid: string;
    slug: string;
    title: string;
    status: string;
    closeAt: Date;
  };
};

export type CreateOrderInput = {
  userUuid: string;
  marketUuid: string;
  side: string;
  outcome: string;
  orderType?: string;
  price: number;
  quantity: number;
};

export type ListOrdersInput = {
  userUuid: string;
  marketUuid?: string;
  status?: string;
  limit?: number;
};

export type ListOrdersResult = {
  items: OrderRecord[];
  meta: {
    count: number;
    limit: number;
  };
};

export interface OrderServiceContract {
  createOrder(input: CreateOrderInput): Promise<OrderRecord>;
  listOrders(input: ListOrdersInput): Promise<ListOrdersResult>;
  cancelOrder(input: { userUuid: string; orderUuid: string }): Promise<OrderRecord>;
}

export class OrderError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "OrderError";
  }
}

const mapOrder = (order: {
  uuid: string;
  userUuid: string;
  marketUuid: string;
  side: string;
  outcome: string;
  orderType: string;
  status: string;
  price: number;
  quantity: number;
  remainingQuantity: number;
  createdAt: Date;
  canceledAt: Date | null;
  market: {
    uuid: string;
    slug: string;
    title: string;
    status: string;
    closeAt: Date;
  };
}): OrderRecord => ({
  uuid: order.uuid,
  userUuid: order.userUuid,
  marketUuid: order.marketUuid,
  side: order.side,
  outcome: order.outcome,
  orderType: order.orderType,
  status: order.status,
  price: order.price,
  quantity: order.quantity,
  remainingQuantity: order.remainingQuantity,
  createdAt: order.createdAt,
  canceledAt: order.canceledAt,
  market: {
    uuid: order.market.uuid,
    slug: order.market.slug,
    title: order.market.title,
    status: order.market.status,
    closeAt: order.market.closeAt,
  },
});

const assertOrderSide = (side: string) => {
  if (!ORDER_SIDES.includes(side as (typeof ORDER_SIDES)[number])) {
    throw new OrderError("Lado da ordem invalido.", 400);
  }
};

const assertOrderOutcome = (outcome: string) => {
  if (!ORDER_OUTCOMES.includes(outcome as (typeof ORDER_OUTCOMES)[number])) {
    throw new OrderError("Resultado da ordem invalido.", 400);
  }
};

const assertOrderType = (orderType: string) => {
  if (!ORDER_TYPES.includes(orderType as (typeof ORDER_TYPES)[number])) {
    throw new OrderError("Tipo de ordem invalido.", 400);
  }
};

const assertPrice = (price: number) => {
  if (!Number.isInteger(price) || price < 1 || price > 99) {
    throw new OrderError("O preco deve ser um inteiro entre 1 e 99.", 400);
  }
};

const assertQuantity = (quantity: number) => {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new OrderError("A quantidade deve ser um inteiro maior que zero.", 400);
  }
};

const assertMarketCanReceiveOrders = (market: {
  status: string;
  outcomeType: string;
  closeAt: Date;
}) => {
  if (market.status !== "open") {
    throw new OrderError("O mercado nao esta aberto para negociacao.", 400);
  }

  if (market.outcomeType !== "binary") {
    throw new OrderError("Apenas mercados binarios sao suportados neste MVP.", 400);
  }

  if (market.closeAt.getTime() <= Date.now()) {
    throw new OrderError("O mercado ja encerrou o periodo de negociacao.", 400);
  }
};

export class OrderService implements OrderServiceContract {
  async createOrder(input: CreateOrderInput): Promise<OrderRecord> {
    const normalizedOrderType = input.orderType ?? "limit";

    assertOrderSide(input.side);
    assertOrderOutcome(input.outcome);
    assertOrderType(normalizedOrderType);
    assertPrice(input.price);
    assertQuantity(input.quantity);

    const market = await prisma.market.findUnique({
      where: {
        uuid: input.marketUuid,
      },
    });

    if (!market) {
      throw new OrderError("Mercado nao encontrado.", 404);
    }

    assertMarketCanReceiveOrders(market);

    const order = await prisma.order.create({
      data: {
        userUuid: input.userUuid,
        marketUuid: input.marketUuid,
        side: input.side,
        outcome: input.outcome,
        orderType: normalizedOrderType,
        status: "open",
        price: input.price,
        quantity: input.quantity,
        remainingQuantity: input.quantity,
      },
      include: {
        market: {
          select: {
            uuid: true,
            slug: true,
            title: true,
            status: true,
            closeAt: true,
          },
        },
      },
    });

    await writeAuditLog({
      action: "orders.created",
      targetType: "order",
      targetUuid: order.uuid,
      payload: {
        marketUuid: order.marketUuid,
        side: order.side,
        outcome: order.outcome,
        price: order.price,
        quantity: order.quantity,
      },
    });

    return mapOrder(order);
  }

  async listOrders(input: ListOrdersInput): Promise<ListOrdersResult> {
    const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIST_LIMIT, 1), MAX_LIST_LIMIT);

    const items = await prisma.order.findMany({
      where: {
        userUuid: input.userUuid,
        marketUuid: input.marketUuid,
        status: input.status,
      },
      include: {
        market: {
          select: {
            uuid: true,
            slug: true,
            title: true,
            status: true,
            closeAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return {
      items: items.map(mapOrder),
      meta: {
        count: items.length,
        limit,
      },
    };
  }

  async cancelOrder(input: { userUuid: string; orderUuid: string }): Promise<OrderRecord> {
    const existingOrder = await prisma.order.findUnique({
      where: {
        uuid: input.orderUuid,
      },
      include: {
        market: {
          select: {
            uuid: true,
            slug: true,
            title: true,
            status: true,
            closeAt: true,
          },
        },
      },
    });

    if (!existingOrder) {
      throw new OrderError("Ordem nao encontrada.", 404);
    }

    if (existingOrder.userUuid !== input.userUuid) {
      throw new OrderError("Ordem nao encontrada.", 404);
    }

    if (!CANCELABLE_ORDER_STATUSES.includes(existingOrder.status as (typeof CANCELABLE_ORDER_STATUSES)[number])) {
      throw new OrderError("A ordem nao pode mais ser cancelada.", 400);
    }

    const canceledOrder = await prisma.order.update({
      where: {
        uuid: existingOrder.uuid,
      },
      data: {
        status: "cancelled",
        canceledAt: new Date(),
      },
      include: {
        market: {
          select: {
            uuid: true,
            slug: true,
            title: true,
            status: true,
            closeAt: true,
          },
        },
      },
    });

    await writeAuditLog({
      action: "orders.cancelled",
      targetType: "order",
      targetUuid: canceledOrder.uuid,
      payload: {
        marketUuid: canceledOrder.marketUuid,
        status: canceledOrder.status,
      },
    });

    return mapOrder(canceledOrder);
  }
}
