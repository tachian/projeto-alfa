import { describe, expect, it, vi } from "vitest";
import { RealtimeHub } from "./hub.js";

describe("RealtimeHub", () => {
  it("publishes events to subscribed sockets", () => {
    const hub = new RealtimeHub();
    const socket = {
      readyState: 1,
      send: vi.fn(),
    };

    hub.subscribe("market:abc:book", socket as never);
    hub.publish("market:abc:book", {
      type: "book.snapshot",
      orderBook: {
        marketUuid: "abc",
      },
    });

    expect(socket.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: "event",
        channel: "market:abc:book",
        payload: {
          type: "book.snapshot",
          orderBook: {
            marketUuid: "abc",
          },
        },
      }),
    );
  });
});
