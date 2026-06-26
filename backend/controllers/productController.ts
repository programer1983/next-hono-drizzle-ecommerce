import { Context } from "hono";
import { db } from "../db/index.js";
import { products } from "../db/schema.js";
import { desc, and, eq } from "drizzle-orm";

// ======= GET PRODUCTS BY CAYEGORY ================================================================

export async function listProducts(c: Context) {
  try {
    const categoryQuery = c.req.query("category");
    const cat = typeof categoryQuery === "string" ? categoryQuery.trim() : "";

    const activeOnly = eq(products.active, true);
    const whereClause = cat
      ? and(activeOnly, eq(products.category, cat))
      : activeOnly;

    const rows = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(desc(products.createdAt));

    return c.json({ rows });
  } catch (e) {
    throw e;
  }
}

// ======= GET CAYEGORIES ================================================================

export async function getCtagories(c: Context) {
  try {
    const rows = await db
      .select({ category: products.category })
      .from(products)
      .where(eq(products.active, true));

    const categories = [...new Set(rows.map((r) => r.category))].sort((a, b) =>
      a.localeCompare(b),
    );

    return c.json({ categories });
  } catch (e) {
    throw e;
  }
}

// ======= GET PRODUCT BY SLUG ================================================================

export async function getProductBySlug(c: Context) {
  try {
    const slug = c.req.param("slug") || "";
    const [row] = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (!row || !row.active) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json({ product: row });
  } catch (e) {
    throw e;
  }
}
