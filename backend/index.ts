import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { clerkMiddleware, getAuth } from "@clerk/hono";
import { bodyLimit } from "hono/body-limit";
import { clerkWebhookHandler } from "./webhooks/clerk.js";
import { getEnv } from "./lib/validation.js";

const env = getEnv();

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: env.FRONTEND_URL,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.use("*", clerkMiddleware());

const sizeLimiter = bodyLimit({
  maxSize: 1 * 1024 * 1024,
  onError: (c) => c.text("Payload Too Large", 413),
});

app.post("/webhooks/clerk", sizeLimiter, async (c) => {
  const rawBody = await c.req.text();
  await clerkWebhookHandler(c, rawBody);

  return c.json({ success: true });
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
