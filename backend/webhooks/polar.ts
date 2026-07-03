import type { Context } from "hono";
import { getEnv } from "../lib/validation.js";
import { checkOutSessions, orders, orderItems } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { Webhook } from "standardwebhooks";
import { db } from "../db/index.js";
import { error } from "node:console";

function checkoutSessionIdFromMetadata(order: Record<string, unknown>) {
  const metadata = order.metadata;
  if (!metadata || typeof metadata !== "object") return undefined;
  const sessionId = (metadata as Record<string, unknown>).checkout_session_id;
  return typeof sessionId === "string" ? sessionId : undefined;
}

async function alreadyPaid(polarOrderId?: string, checkoutId?: string) {
  if (polarOrderId) {
    const [row] = await db
      .select()
      .from(orders)
      .where(eq(orders.polarOrderId, polarOrderId))
      .limit(1);
    if (row?.status === "paid") return true;
  }

  if (checkoutId) {
    const [row] = await db
      .select()
      .from(orders)
      .where(eq(orders.polarCheckoutId, checkoutId))
      .limit(1);
    if (row?.status === "paid") return true;
  }
  return false;
}

async function fulfillCheckoutSession(
  sessionId: string,
  polarOrderId: string | undefined,
  checkoutId: string | undefined,
) {
  return await db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(checkOutSessions)
      .where(eq(checkOutSessions.id, sessionId))
      .for("update");

    if (!session) return false;

    const [order] = await tx
      .insert(orders)
      .values({
        userId: session.userId,
        status: "paid",
        totalCents: session.totalCents,
        polarCheckoutId: checkoutId ?? session.polarCheckoutId ?? null,
        ...(polarOrderId ? { polarOrderId } : {}),
      })
      .returning();

    if (!order) {
      throw new Error("Failed to insert order");
    }

    if (session.lines.length) {
      await tx.insert(orderItems).values(
        session.lines.map((line) => ({
          orderId: order.id,
          productId: line.productId,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
        })),
      );
    }
    await tx
      .delete(checkOutSessions)
      .where(eq(checkOutSessions.id, session.id));

    return true;
  });
}

export async function polarWebhookHandler(c: Context) {
  const env = getEnv();

  try {
    if (!env.POLAR_WEBHOOK_SECRET) {
      c.status(503);
      return c.text("Polar webhooks not configured");
    }

    const arrayBuffer = await c.req.raw.arrayBuffer();
    const raw = Buffer.from(arrayBuffer);

    const wh = new Webhook(
      Buffer.from(env.POLAR_WEBHOOK_SECRET, "utf-8").toString("base64"),
    );

    const id = c.req.header("webhook-id");
    const ts = c.req.header("webhook-timestamp");
    const sig = c.req.header("webhook-signature");

    if (!id || !ts || !sig) {
      return c.json({ error: "Missing webhook headers" });
    }

    wh.verify(raw, {
      "webhook-id": id,
      "webhook-timestamp": ts,
      "webhook-signature": sig,
    });

    const event = JSON.parse(raw.toString("utf-8")) as {
      type: string;
      data?: Record<string, unknown>;
    };

    if (event.type === "order.paid" && event.data) {
      const data = event.data;
      const polarOrderId = typeof data.id === "string" ? data.id : undefined;
      const checkoutId =
        typeof data.checkout_id === "string" ? data.checkout_id : undefined;

      if (await alreadyPaid(polarOrderId, checkoutId)) {
        return c.json({ ok: true, duplicate: true });
      }

      const sessionId = checkoutSessionIdFromMetadata(data);

      if (sessionId) {
        const ok = await fulfillCheckoutSession(
          sessionId,
          polarOrderId,
          checkoutId,
        );

        if (ok) {
          return c.json({ ok: true });
        }

        if (await alreadyPaid(polarOrderId, checkoutId)) {
          return c.json({ ok: true, duplicate: true });
        }

        console.error("Polar order.paid: could not fulfill checkout session", {
          sessionId,
          checkoutId,
        });
        c.status(500);
        return c.json({ error: "Checkout fulfillment failed" });
      }
    }
    return c.json({ ok: true });
  } catch (error) {
    console.log("Polar webhook error", error);
    c.status(400);
    return c.json({ error: "Invalid webhook" });
  }
}
