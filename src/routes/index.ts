import express from "express";
import { adminRouter } from "@/modules/admin";
import { authRouter } from "@/modules/auth";
import { cartRouter } from "@/modules/cart";
import { orderRouter } from "@/modules/order";
import { productRouter } from "@/modules/product";
import { userRouter } from "@/modules/user";

const router = express.Router();

router.use("/users", userRouter);
router.use("/products", productRouter);
router.use("/admin", adminRouter);
router.use("/orders", orderRouter);
router.use("/cart", cartRouter);

export { router as apiRouter };