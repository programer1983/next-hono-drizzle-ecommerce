// Describe environment types (Environment Variables) in the Hono style
import { type Env } from "./validation.js";

export type CheckoutCategoryBody = {
  products: string[];
  prices?: Record<
    string,
    Array<{
      amount_type: "fixed";
      price_currency: string;
      price_amount: number;
    }>
  >;
  success_url: string;
  return_url?: string;
  external_customer_id?: string;
  customer_email?: string;
  metadata?: Record<string, string | number | boolean>;
};

// Creates a checkout session in the Polar API.
// @param env Environment object (c.env from Hono or the result of getEnv()) @param body Session parameters

export async function polarCreateCheckout(
  env: Env,
  body: CheckoutCategoryBody,
) {
  const token = env.POLAR_ACCESS_TOKEN;
  const apiBase = env.POLAR_API_BASE;

  if (!token) throw new Error("POLAR_ACCESS_TOKEN is not configured");
  if (!apiBase) throw new Error("POLAR_API_BASE is not configured");

  // Strip extra slashes from the end of the base URL to avoid problems like "//v1/checkouts/"
  const cleanApiBase = apiBase.replace(/\/$/, "");

  const res = await fetch(`${cleanApiBase}/v1/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Polar checkout failed: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as { id: string; url: string };
  return { id: data.id, url: data.url };
}
