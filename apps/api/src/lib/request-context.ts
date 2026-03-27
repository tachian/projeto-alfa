import { AsyncLocalStorage } from "node:async_hooks";

export type RequestActor = {
  actorType: string;
  actorUuid?: string;
};

export type RequestContext = {
  requestUuid: string;
  actorType?: string;
  actorUuid?: string;
  ipAddress?: string;
  userAgent?: string;
};

const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export const requestContext = {
  run<T>(context: RequestContext, callback: () => T) {
    return requestContextStorage.run(context, callback);
  },
  enterWith(context: RequestContext) {
    requestContextStorage.enterWith(context);
  },
  get() {
    return requestContextStorage.getStore();
  },
  setActor(actor: RequestActor) {
    const context = requestContextStorage.getStore();

    if (!context) {
      return;
    }

    context.actorType = actor.actorType;
    context.actorUuid = actor.actorUuid;
  },
};
