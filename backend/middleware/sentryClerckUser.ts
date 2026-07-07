import type { MiddlewareHandler } from "hono";
import * as Sentry from "@sentry/hono/node";
import { getAuth } from "@clerk/hono";

export const sentryClerkUserMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    try {
      const auth = getAuth(c);
      const userId = auth?.userId;

      Sentry.getIsolationScope().setUser(userId ? { id: userId } : null);
    } catch {
      Sentry.getIsolationScope().setUser(null);
    }
    await next();
  };
};
