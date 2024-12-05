import QpayApi from "../utils/external-api/qpayApi.js";
import OrderModel from "../model/orderModel.js";
import { successResponse, errorResponse } from "../middleware/Reponse.js";
import UserModel from "../model/userModel.js";
import sendMail from "../utils/sendMail.js";
import ProductModel from "../model/productModel.js";

export default class QpayController {
  static async invoicePaid(req, res, next) {
    const id = parseInt(req.params.id, 10);
    try {
      const order = await OrderModel.get(id);

      // console.log("order items", JSON.stringify(order.items, null, 2));

      order.items.forEach(async (item) => {
        await ProductModel.update(item.id, {
          stock: {
            decrement: item.quantity,
          },
        });
      });

      if (!order) {
        return errorResponse(res, 404, "Order not found");
      }
      const updatedOrder = await OrderModel.update(id, {
        is_paid: true,
      });
      const user = await UserModel.get(order.user_id);
      await sendMail({
        email: user.email,
        subject: "Order paid",
        template: "order-paid.ejs",
        data: {
          name: user.email,
          message: `${order.id}-дугаартай захиалга төлөгдлөө`,
        },
      });
      if (updatedOrder) {
        await sendMail({
          email: "munkherdene.ts0706@gmail.com",
          subject: "Шинэ захиалга",
          template: "order-new.ejs",
          data: {
            name: user.email,
            message: `${order.id}-дугаартай захиалга төлөгдлөө`,
            items: order.items,
          },
        });
      }

      return successResponse(res, 200, "Төлөгдсөн");
    } catch (error) {
      next(error);
    }
  }
  static async checkInvoice(req, res, next) {
    const id = parseInt(req.params.id, 10);
    try {
      const order = await OrderModel.get(id);
      if (!order) {
        return errorResponse(res, 404, "Order not found");
      }
      if (order.is_paid === true) {
        return successResponse(res, 200, "PAID");
      }
      return successResponse(res, 200, "UNPAID");
    } catch (error) {
      next(error);
    }
  }

  static async createInvoice(req, res, next) {
    try {
      const { orderId, amount } = req.body;
      const data = {
        sender_invoice_no: `M2M-${orderId}`,
        invoice_receiver_code: `M2M-${orderId}`,
        invoice_description: "MY-TECH.mn",
        amount: amount,
        invoice_code: process.env.QPAY_INVOICE_CODE,
        callback_url: process.env.QPAY_CALLBACK_URL + orderId,
      };
      const qpayInvoice = await QpayApi.create_invoice(data);
      console.log("end irj bna", qpayInvoice.data);
      return successResponse(res, 200, qpayInvoice.data);
    } catch (error) {
      next(error);
    }
  }
}
