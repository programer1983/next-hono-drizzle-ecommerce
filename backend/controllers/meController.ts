import { Context } from "hono";
import { getAuth } from "@clerk/hono";
import { getLocalUser } from "../lib/users.js";

export const getMe = async (c: Context) => {
  try {
    const auth = getAuth(c);

    if (!auth || !auth.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const user = await getLocalUser(auth.userId);
    return c.json({ user });
  } catch (e) {
    console.error("Error in getMe controller:", e);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};
