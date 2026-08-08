import { StreamChat } from "stream-chat";
import type { Context } from "hono";
import type { UserRole } from "../db/schema.js";

export type Env = {
  Bindings: {
    STREAM_API_KEY: string;
    STREAM_API_SECRET: string;
    CLERK_SECRET_KEY: string;
  };
};

export function streamChatDisplayName(
  role: UserRole,
  displayName: string | null,
  email: string,
): string {
  const base = displayName ?? email.split("@")[0] ?? "";
  if (role === "admin") return `Admin · ${base}`;
  if (role === "support") return `Support · ${base}`;
  return base;
}

// export function getStreamChatServer(c: Context<Env>) {
//   return StreamChat.getInstance(c.env.STREAM_API_KEY, c.env.STREAM_API_SECRET);
// }

export function getStreamChatServer(envOrContext?: Context<Env>) {
  const apiKey =
    envOrContext?.env?.STREAM_API_KEY ?? process.env.STREAM_API_KEY ?? "";
  const apiSecret =
    envOrContext?.env?.STREAM_API_SECRET ?? process.env.STREAM_API_SECRET ?? "";

  return StreamChat.getInstance(apiKey, apiSecret);
}

export function streamUserId(clerkUserId: string): string {
  return `clerk_${clerkUserId}`;
}
