import { Hono } from "hono";
import { checkoutRoute } from "../controllers/checkoutController.js";

const router = new Hono();

router.route("/", checkoutRoute);

export default router;
