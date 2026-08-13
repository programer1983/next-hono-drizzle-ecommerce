import "dotenv/config";
import * as Sentry from "@sentry/hono/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { clerkMiddleware } from "@clerk/hono";
import { bodyLimit } from "hono/body-limit";
import { clerkWebhookHandler } from "../webhooks/clerk.js";
import { getEnv } from "../lib/validation.js";
import meRouter from "../routes/meRoute.js";
import productRouter from "../routes/productRouter.js";
import streamRouter from "../routes/streamRouter.js";
import checkoutRouter from "../routes/checkoutRouter.js";
import adminRouter from "../routes/adminRouter.js";
import orderRouter from "../routes/orderRouter.js";
import { polarWebhookHandler } from "../webhooks/polar.js";
import { sentryClerkUserMiddleware } from "../middleware/sentryClerckUser.js";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { handle } from "hono/vercel";

const env = getEnv();

const app = new Hono();

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 5,
});

export const db = drizzle(pool);

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV ?? "development",
    enableLogs: true,
    tracesSampleRate: 1.0,
    sendDefaultPii: true,
    integrations: [nodeProfilingIntegration()],
    profilesSampleRate: 1.0,
  } as Sentry.NodeOptions);
}

app.use("*", Sentry.sentry(app));

app.use(
  "/api/*",
  cors({
    origin: env.FRONTEND_URL,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use("*", async (c, next) => {
  if (c.req.path === "/webhooks/clerk") {
    return await next();
  }
  return clerkMiddleware()(c, next);
});

app.use("/api/*", sentryClerkUserMiddleware());

const sizeLimiter = bodyLimit({
  maxSize: 1 * 1024 * 1024,
  onError: (c) => c.text("Payload Too Large", 413),
});

app.use("/webhooks/clerk", sizeLimiter);

app.route("/api/me", meRouter);
app.route("/api/products", productRouter);
app.route("/api/stream", streamRouter);
app.route("/api/checkout", checkoutRouter);
app.route("/api/admin", adminRouter);
app.route("/api/orders", orderRouter);

app.post("/webhooks/clerk", clerkWebhookHandler);
app.post("/webhooks/polar", polarWebhookHandler);

app.get("/", (c) => {
  return c.text("Hello Dimon!!!");
});

const port = env.PORT;

console.log(`Server is running on port ${port}`);

app.onError((err, c) => {
  console.error("GLOBAL ERROR:", err.message, err.stack);
  Sentry.captureException(err);

  return c.json(
    {
      error: "Internal Server Error",
      message: env.NODE_ENV === "development" ? err.message : undefined,
    },
    500,
  );
});

if (process.env.NODE_ENV !== "production") {
  console.log(`Server is running on port ${port}`);
  serve({
    fetch: app.fetch,
    port,
  });
}

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
export default app;
