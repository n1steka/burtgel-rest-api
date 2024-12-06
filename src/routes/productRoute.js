import express from "express";
import { ProductController } from "../controller/productController.js";
const router = express.Router();

const productController = new ProductController();

router.get("/products", productController.getActiveProducts);
router.get("/totalProducts", productController.totalProducts);
router.get("/endProducts", productController.endProducts);
router.get("/graphProducts", productController.graphProducts);
router.post("/product", productController.create);
router.put("/product/:id", productController.update);
router.get("/product/:id", productController.detail);
router.delete("/product/:id", productController.delete);

export default router;
