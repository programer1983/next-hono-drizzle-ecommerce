import z from "zod";
import type { UserRole } from "../db/schema.js";

export const userRolesSchema = z.enum(["customer", "support", "admin"]);

export function parseRole(value: unknown): UserRole {
  const result = userRolesSchema.safeParse(value);
  return result.success ? result.data : "customer";
}

export function isAdmin(role: UserRole | undefined | null): boolean {
  return role === "admin";
}

export function isStaff(role: UserRole | undefined | null): boolean {
  return role === "support" || role === "admin";
}
