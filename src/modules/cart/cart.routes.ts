import express from "express";
import { authenticateToken } from "@/middlewares/auth";
import { validateBody } from "@/middlewares/validate";
import { CartController } from "./cart.controller";
import { addToCartSchema, removeFromCartSchema } from "./cart.schema";

const router = express.Router();

const cartController = CartController.getInstance();

router.use(authenticateToken);

router.get("/", cartController.getCart);
router.post("/add", validateBody(addToCartSchema), cartController.addToCart);
router.post("/remove", validateBody(removeFromCartSchema), cartController.removeFromCart);

export default router;