import express from "express";
import QpayController from "../controller/qpayController.js";

const router = express.Router();

// Нэхэмжлэх төлөгдөх QPay талаас дуудагдана.
router.get("/qpay/paid/:id", QpayController.invoicePaid);
router.get("/qpay/check/:id", QpayController.checkInvoice);

// QPay дээр invoice үүсгэх
router.post("/qpay/create", QpayController.createInvoice);
export default router;
