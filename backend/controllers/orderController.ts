import type { Context } from "hono";
import { getEnv } from "../lib/validation.js";
import { getAuth } from "@clerk/hono";
import { getLocalUser } from "../lib/users.js";
import { isStaff } from "../lib/roles.js";
import { db } from "../db/index.js";
import { orderItems, orders, products, users } from "../db/schema.js";
import { asc, desc, eq, inArray } from "drizzle-orm";
import {
  getStreamChatServer,
  streamChatDisplayName,
  streamUserId,
} from "../lib/stream.js";
import { Environment } from "svix/dist/api/environment.js";

const env = getEnv();

// ===== LIST ORDERS ===================================================================================
export async function listOrders(c: Context) {
  const { userId, isAuthenticated } = getAuth(c);
  if (!userId || !isAuthenticated) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const localUser = await getLocalUser(userId);
  if (!localUser) {
    return c.json({ error: "Account not synced yet" }, 403);
  }

  const rows = isStaff(localUser.role)
    ? await db.select().from(orders).orderBy(desc(orders.createdAt))
    : await db
        .select()
        .from(orders)
        .where(eq(orders.userId, localUser.id))
        .orderBy(desc(orders.createdAt));

  const orderIds = rows.map((r) => r.id);
  const previewByOrder = new Map();

  if (orderIds.length > 0) {
    const itemRow = await db
      .select({
        orderId: orderItems.orderId,
        quantity: orderItems.quantity,
        name: products.name,
        slug: products.slug,
        imageUrl: products.imageUrl,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(inArray(orderItems.orderId, orderIds))
      .orderBy(asc(orderItems.id));

    for (const row of itemRow) {
      const list = previewByOrder.get(row.orderId) ?? [];
      list.push({
        name: row.name,
        slug: row.slug,
        imageUrl: row.imageUrl,
        quantity: row.quantity,
      });
      previewByOrder.set(row.orderId, list);
    }
  }
  const ordersPaylad = rows.map((o) => ({
    ...o,
    previewItems: previewByOrder.get(o.id) ?? [],
  }));
  return c.json({ orders: ordersPaylad });
}

// ===== GET ORDER ===================================================================================
export async function getOrder(c: Context) {
  const { userId, isAuthenticated } = getAuth(c);
  if (!userId || !isAuthenticated) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const localUser = await getLocalUser(userId);
  if (!localUser) {
    return c.json({ error: "Account not synced yet" }, 503);
  }

  const id = c.req.param("id");

  if (!id) {
    return c.json({ error: "Missing ID" }, 400);
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) {
    return c.json({ error: "Not found" }, 404);
  }

  const canAcces = order.userId === localUser.id || isStaff(localUser.role);

  if (!canAcces) {
    return c.json({ error: "Not found" }, 404);
  }

  const items = await db
    .select({
      orderId: orderItems.id,
      quantity: orderItems.quantity,
      unitPriceCents: orderItems.unitPriceCents,
      products: products,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, order.id));

  return c.json({ order, items });
}

// ===== CREATE STREAM CHANEL ===========================================================================
export async function createStreamChannel(c: Context) {
  const { userId, isAuthenticated } = getAuth(c);
  if (!userId || !isAuthenticated) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const server = getStreamChatServer(c.env);
  const localUser = await getLocalUser(userId);
  if (!localUser) {
    return c.json({ error: "Account not synced yet" }, 503);
  }

  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Missing ID" }, 400);
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) {
    return c.json({ error: "Not found" }, 404);
  }

  const isOwner = order.userId === localUser.id;
  if (!isOwner && !isStaff(localUser.role)) {
    return c.json({ error: "Not found" }, 404);
  }

  if (order.status !== "paid") {
    return c.json({ error: "Order must be paid to open support chat" }, 403);
  }

  const [owner] = await db
    .select()
    .from(users)
    .where(eq(users.id, order.userId))
    .limit(1);

  if (!owner) {
    return c.json({ error: "Customer not found" }, 404);
  }

  const customerSid = streamUserId(owner.clerkUserId);
  await server.upsertUser({
    id: customerSid,
    name: owner.displayName ?? owner.email ?? "Customer",
  });

  const currentStreamUserId = streamUserId(userId);
  await server.upsertUser({
    id: currentStreamUserId,
    name: streamChatDisplayName(
      localUser.role,
      localUser.displayName,
      localUser.email,
    ),
  });

  const channelId = `order-${order.id}`;

  const members = Array.from(new Set([currentStreamUserId, customerSid]));

  const channel = server.channel("messaging", channelId, {
    name: `Support · order ${order.id.slice(0, 8)}`,
    created_by_id: currentStreamUserId,
    members: members,
  } as any);

  await channel.create();

  return c.json({
    channelType: "messaging",
    channelId,
    streamUserId: currentStreamUserId,
  });
}

// ===== CREATE VIDEO INVITE ===========================================================================
export async function createVideoInvite(c: Context) {
  const { userId, isAuthenticated } = getAuth(c);
  if (!userId || !isAuthenticated) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const server = getStreamChatServer(c.env);
  const localUser = await getLocalUser(userId);
  if (!localUser) {
    return c.json({ error: "Account not synced yet" }, 503);
  }

  if (!isStaff(localUser.role)) {
    return c.json(
      { error: "Only support or admin can send a video invite" },
      403,
    );
  }

  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Missing ID" }, 400);
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order || order.status !== "paid") {
    return c.json({ error: "Order not found or not paid" }, 404);
  }

  const [owner] = await db
    .select()
    .from(users)
    .where(eq(users.id, order.userId))
    .limit(1);

  if (!owner) {
    return c.json({ error: "Customer not found" }, 404);
  }

  const customerSid = streamUserId(owner.clerkUserId);
  await server.upsertUser({
    id: customerSid,
    name: owner.displayName ?? owner.email ?? "Customer",
  });

  const staffStreamUserId = streamUserId(userId);
  await server.upsertUser({
    id: staffStreamUserId,
    name: streamChatDisplayName(
      localUser.role,
      localUser.displayName,
      localUser.email,
    ),
  });

  const channelId = `order-${order.id}`;
  const channel = server.channel("messaging", channelId, {
    name: `Support · order ${order.id.slice(0, 8)}`,
    created_by_id: staffStreamUserId,
    members: [customerSid, staffStreamUserId],
  } as any);

  await channel.create();

  const joinUrl = `${env.FRONTEND_URL.replace(/\/+$/, "")}/orders/${order.id}/call`;

  await channel.sendMessage({
    text: `Video call — tap Join below (same link for everyone): ${joinUrl}`,
    user_id: staffStreamUserId,
    custom: {
      video_invite: true,
      join_url: joinUrl,
    },
  } as any);

  return c.json({ ok: true, joinUrl });
}
