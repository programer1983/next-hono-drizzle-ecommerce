import z, { ZodError } from "zod";
import { getEnv } from "../lib/validation.js";
import { orderItems, products } from "../db/schema.js";
import type { Context, Next } from "hono";
import { getAuth } from "@clerk/hono";
import { getLocalUser } from "../lib/users.js";
import ImageKit from "@imagekit/nodejs";
import { db } from "../db/index.js";
import { desc, eq, count } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { createFactory } from "hono/factory";
import { isAdmin } from "../lib/roles.js";
import { deleteImageKitAsset } from "../lib/imagekit.js";

const env = getEnv();

const factory = createFactory();

const productCreate = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1).default("General"),
  description: z.string().default(""),
  priceCents: z.number().int().positive(),
  currency: z.string().min(1).default("usd"),
  imageUrl: z
    .union([z.string().url(), z.literal("")])
    .optional()
    .nullable(),
  imageKitFileId: z
    .union([z.string().min(1), z.literal(""), z.null()])
    .optional(),
  active: z.boolean().default(true),
});

const productPath = productCreate.partial();

function buildProductUpdateSet(body: z.infer<typeof productPath>) {
  const data: Partial<typeof products.$inferInsert> = {};

  if (body.slug !== undefined) data.slug = body.slug;
  if (body.name !== undefined) data.name = body.name;
  if (body.category !== undefined) data.category = body.category;
  if (body.description !== undefined) data.description = body.description;
  if (body.priceCents !== undefined) data.priceCents = body.priceCents;
  if (body.currency !== undefined) data.currency = body.currency;
  if (body.imageUrl !== undefined)
    data.imageUrl = body.imageUrl === "" ? null : body.imageUrl;
  if (body.imageKitFileId !== undefined)
    data.imageKitFileId =
      body.imageKitFileId === "" ? null : body.imageKitFileId;
  if (body.active !== undefined) data.active = body.active;
  return data;
}

// ======= Middleware for admin verification ===================================================
export async function requireAdmin(c: Context, next: Next) {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const user = await getLocalUser(auth.userId);

  if (!isAdmin(user?.role)) {
    return c.json({ message: "Admin only" }, 403);
  }

  await next();
}

// ======= Obtaining ImageKit authorization parameters =========================================
export async function getImageKitAuth(c: Context) {
  const client = new ImageKit({ privateKey: env.IMAGEKIT_PRIVATE_KEY });
  const auth = client.helper.getAuthenticationParameters();

  return c.json({
    ...auth,
    publickKey: env.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
  });
}

// ======= List of products =====================================================================

export async function listAdminProducts(c: Context) {
  const rows = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt));
  return c.json({ products: rows });
}

// ======= Validator for product creation ========================================================

export const createProductValidator = zValidator(
  "json",
  productCreate,
  (result, c) => {
    if (!result.success) {
      const error = result.error as ZodError;
      return c.json({ error: "Invalid body", details: error.flatten() }, 400);
    }
  },
);

// ======= Product creation =======================================================================

export const createAdminProduct = factory.createHandlers(
  createProductValidator,
  async (c) => {
    const body = c.req.valid("json");
    const { imageUrl, imageKitFileId, ...rest } = body;

    const [row] = await db
      .insert(products)
      .values({
        ...rest,
        imageUrl: imageUrl || null,
        imageKitFileId: imageKitFileId || null,
      })
      .returning();

    return c.json({ product: row }, 201);
  },
);

// ======= Validator for product update =============================================================

export const validateProductPath = zValidator(
  "json",
  productCreate.partial(),
  (result, c) => {
    if (!result.success) {
      const error = result.error as ZodError;
      return c.json({ error: "Invalid body", details: error.flatten() }, 400);
    }
  },
);

// =======  Product update ==========================================================================

export const updateAdminProduct = factory.createHandlers(
  validateProductPath,
  async (c) => {
    const body = c.req.valid("json");
    const id = c.req.param("id");

    if (!id) {
      return c.json({ error: "Missing product ID" }, 400);
    }

    const data = buildProductUpdateSet(body);
    if (Object.keys(data).length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }

    const [row] = await db
      .update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning();

    if (!row) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json({ product: row });
  },
);

// =======  Removing a product ==========================================================================

export async function deleteAdminProduct(c: Context) {
  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Missing product ID" }, 400);
  }
  const [existing] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  const [contRow] = await db
    .select({ c: count() })
    .from(orderItems)
    .where(eq(orderItems.productId, id));

  if (Number(contRow?.c ?? 0) > 0) {
    return c.json(
      {
        error:
          "This product is on one or more orders and cannot be deleted. Deactivate it instead.",
      },
      404,
    );
  }

  await deleteImageKitAsset(env, existing.imageKitFileId);
  await db.delete(products).where(eq(products.id, id));

  return c.json({ ok: true });
}
