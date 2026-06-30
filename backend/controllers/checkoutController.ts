import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getAuth } from "@clerk/hono";
import z from "zod";

import { getEnv } from "../lib/validation.js";
import { getLocalUser } from "../lib/users.js";
import { db } from "../db/index.js";
import {
  products,
  checkOutSessions,
  type CheckoutSessionLine,
} from "../db/schema.js";
import { eq, and, inArray } from "drizzle-orm";
import { polarCreateCheckout } from "./../lib/polar.js";

// 1. Creating a validation scheme
const cartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

// 2. Initializing the Hono router
const app = new Hono();

// 3. We declare and export our endpoint directly
export const checkoutRoute = app.post(
  "/",
  zValidator("json", cartSchema),
  async (c) => {
    const env = getEnv();

    try {
      // Checking Clerk Authorization
      const auth = getAuth(c);
      if (!auth || !auth.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      const userId = auth.userId;

      // We receive validated cart data
      const { items } = c.req.valid("json");

      if (!env.POLAR_ACCESS_TOKEN) {
        return c.json({ error: "Payments are not configured" }, 503);
      }

      // Checking account synchronization
      const localUser = await getLocalUser(userId);
      if (!localUser) {
        return c.json({ error: "Account not synced yet" }, 503);
      }

      // Collect IDs (Recommended to wrap in [...new Set(...)] if duplicate IDs are possible in the cart)
      const ids = items.map((i) => i.productId);

      // Request for active products from the database
      const prodRows = await db
        .select()
        .from(products)
        .where(and(inArray(products.id, ids), eq(products.active, true)));

      if (prodRows.length !== ids.length) {
        return c.json({ error: "One or more products are invalid" }, 400);
      }

      const byId = new Map(prodRows.map((p) => [p.id, p]));
      let totalCents = 0;
      const lines: CheckoutSessionLine[] = [];

      // Calculating the cost of the basket
      for (const line of items) {
        const p = byId.get(line.productId)!;
        totalCents += p.priceCents * line.quantity;
        lines.push({
          productId: p.id,
          quantity: line.quantity,
          unitPriceCents: p.priceCents,
        });
      }

      if (totalCents < 10) {
        return c.json(
          {
            error:
              "Total below Polar minimum (e.g. USD requires at least 10 cents)",
          },
          400,
        );
      }

      // We create a session in our database
      const [session] = await db
        .insert(checkOutSessions)
        .values({
          userId: localUser.id,
          lines,
          totalCents,
          currency: "usd",
        })
        .returning();

      if (!session) {
        return c.json({ message: "Failed to create checkout session" }, 500);
      }

      const successUrl = `${env.FRONTEND_URL}/checkout/return?checkout_id={CHECKOUT_ID}`;
      const returnUrl = `${env.FRONTEND_URL}/cart`;

      // Create a payment session in Polar
      const checkout = await polarCreateCheckout(env, {
        products: [env.POLAR_CHECKOUT_PRODUCT_ID],
        prices: {
          [env.POLAR_CHECKOUT_PRODUCT_ID]: [
            {
              amount_type: "fixed",
              price_currency: "usd",
              price_amount: totalCents,
            },
          ],
        },
        success_url: successUrl,
        return_url: returnUrl,
        external_customer_id: userId,
        metadata: { checkout_session_id: session.id },
      });

      await db
        .update(checkOutSessions)
        .set({ polarCheckoutId: checkout.id })
        .where(eq(checkOutSessions.id, session.id));

      return c.json({ checkoutUrl: checkout.url });
    } catch (e) {
      throw e;
    }
  },
);
