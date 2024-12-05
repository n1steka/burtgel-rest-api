import express from "express";
import { OrderController } from "../controller/orderController.js";
import { protect } from "../middleware/protect.js";
const router = express.Router();

const orderController = new OrderController();

router.get("/orders", orderController.allOrders);
router.get("/orders/user", protect, orderController.listAll);
router.post("/order", protect, orderController.create);
router.get("/order/:id", protect, orderController.detail);
// router.post("/order",  orderController.create);

export default router;
