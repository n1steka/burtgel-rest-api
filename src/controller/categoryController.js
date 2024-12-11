// Start of Selection
import CategoryModel from "../model/categoryModel.js";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import { errorResponse, successResponse } from "../middleware/Reponse.js";
cloudinary.config({
  cloud_name: "drzymx72n",
  api_key: "663325969529548",
  api_secret: "AjDUnDrCCMii_OqZOveUjeQPQ5U",
  secure: true,
});

const prisma = new PrismaClient();
export class CategoryController {
  async create(req, res) {
    try {
      // Check payload size
      if (req.headers["content-length"] > 10485760) {
        // 10MB limit
        return res.status(413).json({ error: "Request entity too large" });
      }
      const { coverimageurl, iconurl, category_order, parentid } = req.body;
      let data = {
        ...req.body,
        parentid: +parentid || null,
      };

      // Handle image uploads if provided
      if (iconurl) {
        const uploadOptions = {
          folder: "hitech",
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png"],
          max_bytes: 5242880, // 5MB per image
        };
        const iconUpload = await cloudinary.uploader.upload(
          iconurl,
          uploadOptions
        );
        data.iconurl = iconUpload.secure_url;
      }

      if (coverimageurl) {
        const uploadOptions = {
          folder: "hitech",
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png"],
          max_bytes: 5242880, // 5MB per image
        };
        const coverImageUpload = await cloudinary.uploader.upload(
          coverimageurl,
          uploadOptions
        );
        data.coverimageurl = coverImageUpload.secure_url;
      }

      const category = await prisma.category.create({ data });
      return res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      if (error.http_code === 413) {
        return res.status(413).json({ error: "Image file size too large" });
      }
      return res.status(500).json({ error: "Failed to create category" });
    }
  }

  async detail(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "category ID is required" });
      }

      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return res.status(400).json({ error: "Invalid category ID format" });
      }

      const category = await CategoryModel.detail(parsedId);

      if (!category) {
        return res.status(404).json({ error: "category not found" });
      }

      return res.status(200).json(category);
    } catch (error) {
      console.error("Error getting category details:", error);
      return res.status(500).json({ error: "Failed to get category details" });
    }
  }

  async getActivecategorys(req, res) {
    try {
      const { page, pageSize, parentid } = req.query;
      const categorys = await CategoryModel.list({
        page: page || 1,
        pageSize: pageSize || 10,
        where: {
          parentid: +parentid || null,
        },
      });
      return res.json(categorys);
    } catch (error) {
      console.error("Error getting active categorys:", error);
      return res.status(500).json({ error: "Failed to get active categorys" });
    }
  }

  async getAll(req, res) {
    try {
      const { page, pageSize } = req.query;
      const categorys = await CategoryModel.list({
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
      const categorys = await CategoryModel.list({
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
      const categorys = await CategoryModel.list({
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
      const categorys = await CategoryModel.list({
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

      const category = await CategoryModel.get(parsedId);
      if (!category) {
        return errorResponse(res, 404, "Category not found");
      }

      if (category.imageurl) {
        const publicId = category.imageurl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`hitech/${publicId}`);
      }

      const deletedCategory = await CategoryModel.delete(parsedId);

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
      const category = await CategoryModel.update(parseInt(id), data);
      return res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      return res.status(500).json({ error: "Failed to update category" });
    }
  }
}
