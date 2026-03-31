import { MarketCatalogService } from "../markets/public-service.js";
import { realtimeHub } from "./hub.js";

export type RealtimeTradePayload = {
  uuid: string;
  marketUuid: string;
  buyOrderUuid: string;
  sellOrderUuid: string;
  price: number;
  quantity: number;
  executedAt?: Date;
};

export interface RealtimePublisherContract {
  publishMarketBook(marketUuid: string): Promise<void>;
  publishTrade(trade: RealtimeTradePayload): Promise<void>;
}

export class RealtimePublisher implements RealtimePublisherContract {
  constructor(private readonly marketCatalogService = new MarketCatalogService()) {}

  async publishMarketBook(marketUuid: string) {
    try {
      const orderBook = await this.marketCatalogService.getOrderBook(marketUuid);
      realtimeHub.publish(`market:${marketUuid}:book`, {
        type: "book.snapshot",
        orderBook,
      });
    } catch {
      // Ignore transient publication failures in the MVP path.
    }
  }

  async publishTrade(trade: RealtimeTradePayload) {
    realtimeHub.publish(`market:${trade.marketUuid}:trades`, {
      type: "trade.executed",
      trade: {
        ...trade,
        executedAt: trade.executedAt?.toISOString(),
      },
    });
  }
}
