import express from "express";
import { authenticateToken } from "@/middlewares/auth";
import { validateBody } from "@/middlewares/validate";
import { ProductController } from "./product.controller";
import { createProductSchema, updateProductSchema } from "./product.schema";

const router = express.Router();

const productController = ProductController.getInstance();

// All product routes currently require a valid session (parity with the
// previous API — they are NOT admin-gated; see the admin follow-up note).
router.use(authenticateToken);

router.get("/", productController.getAll);
router.post("/", validateBody(createProductSchema), productController.create);
router.put("/:id", validateBody(updateProductSchema), productController.update);
router.delete("/:id", productController.delete);
router.get("/:id", productController.getById);

export default router;