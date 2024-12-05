// Start of Selection
import orderModel from "../model/orderModel.js";
import { PrismaClient } from "@prisma/client";
import QpayApi from "../utils/external-api/qpayApi.js";
const prisma = new PrismaClient();
export class OrderController {
  async create(req, res) {
    try {
      const userId = req.user.id;
      const data = req.body;
      const order = await prisma.orders.create({
        data: { ...data, user_id: userId },
      });
      const qpayData = {
        sender_invoice_no: `M2M-${order.id}`,
        invoice_receiver_code: `M2M-${order.id}`,
        invoice_description: "MY-TECH.mn",
        amount: order.amount,
        invoice_code: process.env.QPAY_INVOICE_CODE,
        callback_url: process.env.QPAY_CALLBACK_URL + order.id,
      };
      const qpayInvoice = await QpayApi.create_invoice(qpayData);
      const update = await prisma.orders.update({
        where: { id: order.id },
        data: { qpay: qpayInvoice.data },
      });
      console.log("update", update);
      return res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      return res.status(500).json({ error: "Failed to create order" });
    }
  }

  async detail(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      if (!id) {
        return res.status(400).json({ error: "order ID is required" });
      }
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return res.status(400).json({ error: "Invalid order ID format" });
      }
      const order = await prisma.orders.findFirst({
        where: { id: parsedId, user_id: userId },
      });

      if (!order) {
        return res.status(404).json({ error: "order not found" });
      }
      return res.status(200).json(order);
    } catch (error) {
      console.error("Error getting order details:", error);
      return res.status(500).json({ error: "Failed to get order details" });
    }
  }

  async listAll(req, res) {
    try {
      let where = {};
      const { page, pageSize, is_paid } = req.query;
      console.log("is_paid", req.query);
      const userId = req.user.id;
      const orders = await orderModel.list({
        page: page || 1,
        pageSize: pageSize || 10,
        where: { ...where, user_id: userId },
      });

      return res.json(orders);
    } catch (error) {
      console.error("Error getting active orders:", error);
      return res.status(500).json({ error: "Failed to get active categorys" });
    }
  }
  async allOrders(req, res) {
    try {
      let where = {};
      const { page, pageSize, is_paid } = req.query;
      if (is_paid) {
        where.is_paid = is_paid;
      }
      const orders = await orderModel.list({
        page: page || 1,
        pageSize: pageSize || 10,
        where,
      });

      return res.json(orders);
    } catch (error) {
      console.error("Error getting active orders:", error);
      return res.status(500).json({ error: "Failed to get active categorys" });
    }
  }

  async getAll(req, res) {
    try {
      const { page, pageSize } = req.query;
      const categorys = await orderModel.list({
        page: page || 1,
        pageSize: pageSize || 15,
      });
      return res.json(categorys);
    } catch (error) {
      console.error("Error getting active categorys:", error);
      return res.status(500).json({ error: "Failed to get active categorys" });
    }
  }

  async getMainCategorys(req, res) {
    try {
      const categorys = await orderModel.list({
        where: {
          parentid: null,
        },
      });
      return res.json(categorys);
    } catch (error) {
      console.error("Error getting active categorys:", error);
      return res.status(500).json({ error: "Failed to get active categorys" });
    }
  }

  async getSpecialcategorys(req, res) {
    try {
      const now = new Date();
      const categorys = await orderModel.list({
        where: {
          isspecial: true,
          specialstartdate: { lte: now },
          specialenddate: { gte: now },
        },
      });
      return res.json(categorys);
    } catch (error) {
      console.error("Error getting special categorys:", error);
      return res.status(500).json({ error: "Failed to get special categorys" });
    }
  }

  async getcategorysOnSale(req, res) {
    try {
      const now = new Date();
      const categorys = await orderModel.list({
        where: {
          saleprice: { not: null },
          salestartdate: { lte: now },
          saleenddate: { gte: now },
        },
      });
      return res.json(categorys);
    } catch (error) {
      console.error("Error getting categorys on sale:", error);
      return res.status(500).json({ error: "Failed to get categorys on sale" });
    }
  }
  async delete(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return errorResponse(res, 400, "Category ID is required");
      }

      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return errorResponse(res, 400, "Invalid category ID format");
      }

      const category = await orderModel.get(parsedId);
      if (!category) {
        return errorResponse(res, 404, "Category not found");
      }

      if (category.imageurl) {
        const publicId = category.imageurl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`hitech/${publicId}`);
      }

      const deletedCategory = await orderModel.delete(parsedId);

      return successResponse(
        res,
        200,
        deletedCategory,
        "Category deleted successfully"
      );
    } catch (error) {
      console.error("Error deleting category:", error);
      return errorResponse(res, 500, "Failed to delete category");
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const category = await orderModel.update(parseInt(id), data);
      return res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      return res.status(500).json({ error: "Failed to update category" });
    }
  }
}
