import { Hono } from "hono";
import {
  getCtagories,
  getProductBySlug,
  listProducts,
} from "../controllers/productController.js";

const router = new Hono();

router.get("/", listProducts);
router.get("/categories", getCtagories);
router.get("/:slug", getProductBySlug);

export default router;
