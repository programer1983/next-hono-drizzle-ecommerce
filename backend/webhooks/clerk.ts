import type { Context } from "hono";
import { getEnv } from "../lib/validation.js";
import { eq } from "drizzle-orm";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/backend";
import { users } from "../db/schema.js";
import { db } from "../db/index.js";
export async function clerkWebhookHandler(c: Context) {
  const env = getEnv();
  try {
    if (!env.CLERK_WEBHOOK_SECRET) {
      return c.text("Webhooks secret is not provided", 503);
    }

    const svix_id = c.req.header("svix-id");
    const svix_timestamp = c.req.header("svix-timestamp");
    const svix_signature = c.req.header("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return c.json({ error: "Missing svix headers" }, 400);
    }

    const payload = await c.req.text();

    const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);

    const evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const u = evt.data;
      const email =
        u.email_addresses?.find((e) => e.id === u.primary_email_address_id)
          ?.email_address ?? u.email_addresses?.[0]?.email_address;
      const displayName =
        [u.first_name, u.last_name].filter(Boolean).join(" ") ||
        u.username ||
        null;
      const role = parseRole(u.public_metadata?.role);

      await db
        .insert(users)
        .values({
          clerkUserId: u.id,
          email,
          displayName,
          role,
        })
        .onConflictDoUpdate({
          target: users.clerkUserId,
          set: { email, displayName, role, updatedAt: new Date() },
        });
    }

    if (evt.type === "user.deleted") {
      const id = evt.data.id;
      if (id) {
        await db.delete(users).where(eq(users.clerkUserId, id));
      }
    }

    return c.json({ ok: true });
  } catch (err) {
    console.error("Clerk webhook error", err);
    return c.json({ error: "Invalid webhook" }, 400);
  }
}
