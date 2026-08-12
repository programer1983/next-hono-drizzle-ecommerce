import { Hono } from "hono";

import {
  createAdminProduct,
  deleteAdminProduct,
  getImageKitAuth,
  listAdminProducts,
  requireAdmin,
  updateAdminProduct,
} from "../controllers/adminController.js";

const router = new Hono();

router.get("/imagekit/auth", getImageKitAuth);
router.get("/products", listAdminProducts);
router.post("/products", ...createAdminProduct);
router.patch("/products/:id", ...updateAdminProduct);
router.delete("/products/:id", deleteAdminProduct);

export default router;
