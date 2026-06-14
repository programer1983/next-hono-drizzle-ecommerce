import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { clerkMiddleware, getAuth } from "@clerk/hono";

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: "http://localhost:3000",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.use("*", clerkMiddleware());

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
