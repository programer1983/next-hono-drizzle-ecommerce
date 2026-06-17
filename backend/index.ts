import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { clerkMiddleware, getAuth } from "@clerk/hono";
import "dotenv/config";
import { bodyLimit } from "hono/body-limit";

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: "http://localhost:3000",
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

const port = Number(process.env.PORT) || 4000;

console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
