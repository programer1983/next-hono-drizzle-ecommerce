import { Hono } from "hono";
import { createStreamToken } from "../controllers/streamController.js";

const router = new Hono();

router.post("/token", createStreamToken);

export default router;
