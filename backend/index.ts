import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { clerkMiddleware, getAuth } from "@clerk/hono";
import { bodyLimit } from "hono/body-limit";
import { clerkWebhookHandler } from "./webhooks/clerk.js";
import { getEnv } from "./lib/validation.js";
import meRouter from "./routes/meRoutes.js";
import productRouter from "./routes/productRouters.js";
import streamRouter from "./routes/streamRouter.js"

const env = getEnv();

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: env.FRONTEND_URL,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

// app.use("*", clerkMiddleware());

app.use("*", async (c, next) => {
  if (c.req.path === "/webhooks/clerk") {
    return await next();
  }
  return clerkMiddleware()(c, next);
});

const sizeLimiter = bodyLimit({
  maxSize: 1 * 1024 * 1024,
  onError: (c) => c.text("Payload Too Large", 413),
});

app.use("/webhooks/clerk", sizeLimiter);

app.route("/api/me", meRouter);
app.route("/api/products", productRouter);
app.route("/api/stream", streamRouter);

app.post("/webhooks/clerk", async (c) => {
  return await clerkWebhookHandler(c);
});

app.get("/", (c) => {
  return c.text("Hello Dimon!!!");
});

const port = env.PORT;

console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;

//ngrok http 4000
