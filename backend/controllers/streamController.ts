import type { Context } from "hono";
import { getAuth } from "@clerk/hono";
import { createClerkClient } from "@clerk/backend";
import { getLocalUser } from "../lib/users.js";
import {
  getStreamChatServer,
  streamChatDisplayName,
  streamUserId,
} from "../lib/stream.js";
import type { Env } from "../lib/stream.js";

export async function createStreamToken(c: Context<Env>) {
  try {
    const auth = getAuth(c);
    if (!auth || !auth.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const userId = auth.userId;

    const localUser = await getLocalUser(userId);
    if (!localUser) {
      return c.json({ error: "Account not synced yet" }, 503);
    }

    const server = getStreamChatServer(c);

    const clerk = createClerkClient({ secretKey: c.env.CLERK_SECRET_KEY });

    const clerkUser = await clerk.users.getUser(userId);

    const combined =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      null;

    const name = streamChatDisplayName(
      localUser.role,
      localUser.displayName ?? combined ?? clerkUser.username,
      localUser.email,
    );

    const image = clerkUser.imageUrl || null;
    const sid = streamUserId(userId);

    await server.upsertUser({
      id: sid,
      name,
      ...(clerkUser.imageUrl ? { image: clerkUser.imageUrl } : {}),
    });

    const token = server.createToken(sid);

    return c.json({
      token,
      apiKey: c.env.STREAM_API_KEY,
      userId: sid,
      name,
      image,
    });
  } catch (e) {
    throw e;
  }
}
