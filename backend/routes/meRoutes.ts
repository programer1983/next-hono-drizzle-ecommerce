import { Hono } from "hono";
import { getMe } from "../controllers/meController.js";

const router = new Hono();

router.get("/", getMe);

export default router;
