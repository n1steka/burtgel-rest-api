import ProductModel from "../model/productModel.js";
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

export class ProductController {
  async create(req, res) {
    try {
      const { backgroundimageurl, product_medias, product_properties } =
        req.body;
      const backgroundImageUrl = await cloudinary.uploader.upload(
        backgroundimageurl,
        {
          folder: "hitech",
        }
      );

      // Upload all media images to cloudinary
      const mediaUrls = [];
      if (product_medias && product_medias.length > 0) {
        for (const media of product_medias) {
          const uploadedMedia = await cloudinary.uploader.upload(media.url, {
            folder: "hitech",
          });
          mediaUrls.push({
            position: media.position,
            url: uploadedMedia.secure_url,
          });
        }
      }

      const productData = {
        name: req.body.name,
        description: req.body.description,
        shortdescription: req.body.shortdescription,
        unitprice: req.body.unitprice,
        status: req.body.status,
        hasdelivery: req.body.hasdelivery,
        weight: req.body.weight,
        stock: +req.body.stock || 0,
        isactive: req.body.isactive,
        isdraft: req.body.isdraft,
        sellemptystock: req.body.sellemptystock,
        saleprice: req.body.saleprice,
        salestartdate: req.body.salestartdate,
        saleenddate: req.body.saleenddate,
        isspecial: req.body.isspecial,
        specialstartdate: req.body.specialstartdate,
        specialenddate: req.body.specialenddate,
        rate: req.body.rate,
        backgroundimageurl: backgroundImageUrl.secure_url,
        brandid: req.body.brandid,
        categoryid: req.body.categoryid,
        medias: mediaUrls,
        product_properties: {
          create: product_properties?.map((prop) => ({
            value: prop.value,
            unit: prop.unit,
            propertyid: prop.propertyid,
          })),
        },
      };

      const product = await prisma.products.create({
        data: productData,
      });
      return successResponse(res, 201, product, "Product created successfully");
    } catch (error) {
      console.error("Error creating product:", error);
      return errorResponse(res, 500, "Failed to create product");
    }
  }

  async detail(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "Product ID is required" });
      }
      if (id === "add") {
        const category = await CategoryModel.list({
          pageSize: 100,
        });
        return successResponse(
          res,
          200,
          { product: null, category },
          "Product details fetched successfully"
        );
      }
      const parsedId = parseInt(id);

      const product = await prisma.products.findUnique({
        where: {
          id: parsedId,
        },
      });

      const category = await CategoryModel.list({
        pageSize: 100,
      });
      const data = {
        product: product ? product : null,
        category,
      };

      return successResponse(
        res,
        200,
        data,
        "Product details fetched successfully"
      );
    } catch (error) {
      console.error("Error getting product details:", error);
      return errorResponse(res, 500, "Failed to get product details");
    }
  }

  async getActiveProducts(req, res) {
    try {
      let where = {};
      if (req.query.categoryId) {
        where.categoryid = +req.query.categoryId;
      }
      if (req.query.ezemshigchiin_ner) {
        where.ezemshigchiin_ner = { contains: req.query.ezemshigchiin_ner };
      }
      if (req.query.Pc_mark) {
        where.Pc_mark = { contains: req.query.Pc_mark };
      }
      if (req.query.cpu) {
        where.cpu = { contains: req.query.cpu };
      }
      if (req.query.ram) {
        where.ram = { contains: req.query.ram };
      }
      if (req.query.hhp) {
        where.hhp = { contains: req.query.hhp };
      }
      if (req.query.mac_addres) {
        where.mac_addres = { contains: req.query.mac_addres };
      }
      if (req.query.printer) {
        where.printer = { contains: req.query.printer };
      }
      if (req.query.bar_code) {
        where.bar_code = { contains: req.query.bar_code };
      }
      if (req.query.endDate) {
        where.endDate = {
          lte: new Date(req.query.endDate),
        };
      }

      if (req.query.name) {
        where.name = { contains: req.query.name };
      }
      if (req.query.price) {
        const [minPrice, maxPrice] = req.query.price.split("-").map(Number);
        where.unitprice = {
          gte: minPrice,
          lte: maxPrice,
        };
      }

      const products = await ProductModel.list({
        page: req.query.page || 1,
        pageSize: req.query.pageSize || 100,
        where,
        include: {
          category: true,
        },
      });
      return successResponse(
        res,
        200,
        products,
        "Active products fetched successfully"
      );
    } catch (error) {
      console.error("Error getting active products:", error);
      return errorResponse(res, 500, "Failed to get active products");
    }
  }

  async getSpecialProducts(req, res) {
    try {
      const now = new Date();
      const products = await ProductModel.list({
        where: {
          isspecial: true,
          specialstartdate: { lte: now },
          specialenddate: { gte: now },
        },
      });
      return res.json(products);
    } catch (error) {
      console.error("Error getting special products:", error);
      return res.status(500).json({ error: "Failed to get special products" });
    }
  }


  async totalProducts(req, res) {
    try {
      const totalProducts = await prisma.products.count();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const productsAddedToday = await prisma.products.count({
        where: {
          createdat: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      });

      const stats = {
        totalProducts,
        productsAddedToday
      };

      return successResponse(res, 200, stats, "Product statistics fetched successfully");
    } catch (error) {
      console.error("Error getting product statistics:", error);
      return errorResponse(res, 500, "Failed to get product statistics");
    }
  }
  async endProducts(req, res) {
    try {
      const now = new Date();
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const skip = (page - 1) * pageSize;

      let where = {
        endDate: {
          lt: now
        }
      };

      // Add name filter if provided
      if (req.query.name) {
        where.ezemshigchiin_ner = {
          contains: req.query.name,
          mode: 'insensitive'
        };
      }

      // Add end date range filter if provided
      if (req.query.startDate && req.query.endDate) {
        where.endDate = {
          gte: new Date(req.query.startDate),
          lte: new Date(req.query.endDate)
        };
      } else if (req.query.startDate) {
        where.endDate = {
          gte: new Date(req.query.startDate)
        };
      } else if (req.query.endDate) {
        where.endDate = {
          lte: new Date(req.query.endDate)
        };
      }

      const expiredProducts = await prisma.products.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdat: 'desc'
        }
      });

      const totalExpired = await prisma.products.count({
        where
      });

      const totalPages = Math.ceil(totalExpired / pageSize);

      const response = {
        total: totalExpired,
        products: expiredProducts,
        currentPage: page,
        totalPages,
        pageSize
      };

      return successResponse(res, 200, response, "Expired products fetched successfully");
    } catch (error) {
      console.error("Error getting expired products:", error);
      return errorResponse(res, 500, "Failed to get expired products");
    }
  }

  async graphProducts(req, res) {
    try {
      const dailyProducts = await prisma.products.groupBy({
        by: ['endDate'],
        _count: {
          id: true
        },
        orderBy: {
          endDate: 'asc'
        }
      });

      const chartData = dailyProducts.map(item => ({
        date: item.endDate.toISOString().split('T')[0],
        count: item._count.id
      }));

      return successResponse(res, 200, {
        dailyExpiring: chartData
      }, "Өдөр тутмын хугацаа нь дууссан бүтээгдэхүүний тоог амжилттай татаж авлаа");

    } catch (error) {
      console.error("Error getting expiring product counts:", error);
      return errorResponse(res, 500, "Failed to get expiring product counts");
    }
  }

  async getProductsOnSale(req, res) {
    try {
      const now = new Date();
      const products = await ProductModel.list({
        where: {
          saleprice: { not: null },
          salestartdate: { lte: now },
          saleenddate: { gte: now },
        },
      });
      return res.json(products);
    } catch (error) {
      console.error("Error getting products on sale:", error);
      return res.status(500).json({ error: "Failed to get products on sale" });
    }
  }
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      if (!id) {
        return errorResponse(res, 400, "Product ID is required");
      }

      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return errorResponse(res, 400, "Invalid product ID format");
      }

      const product = await ProductModel.get(parsedId);
      if (!product) {
        return errorResponse(res, 404, "Product not found");
      }

      if (product.product_medias?.length > 0) {
        try {
          await Promise.all(
            product.product_medias.map(async (media) => {
              const publicId = media.fileid.split("/").pop().split(".")[0];
              await cloudinary.uploader.destroy(`hitech/${publicId}`);
            })
          );
        } catch (error) {
          return errorResponse(res, 500, "Error deleting product media files");
        }
      }
      if (product.backgroundimageurl) {
        const publicId = product.backgroundimageurl
          .split("/")
          .pop()
          .split(".")[0];
        await cloudinary.uploader.destroy(`hitech/${publicId}`);
      }

      const deletedProduct = await ProductModel.delete(parsedId);

      return successResponse(
        res,
        200,
        deletedProduct,
        "Product deleted successfully"
      );
    } catch (error) {
      return errorResponse(res, 500, error.message);
    }
  }
  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      if (id !== "add") {
        const existingProduct = await ProductModel.get(parseInt(id));
        if (!existingProduct) {
          return errorResponse(res, 404, "Product not found");
        }
        // Remove unnecessary fields before update
        delete data.id;
        delete data.createdat;
        delete data.updatedat;

        if (data.categoryid) {
          data.category = {
            connect: { id: parseInt(data.categoryid) },
          };
          delete data.categoryid;
        }

        const product = await ProductModel.update(parseInt(id), data);

        return successResponse(
          res,
          200,
          product,
          "Product updated successfully"
        );
      } else if (id === "add") {
        try {
          // Prepare product data with proper category relation
          const productData = {
            ezemshigchiin_ner: req.body.ezemshigchiin_ner,
            endDate: req.body.endDate,
            Pc_mark: req.body.Pc_mark,
            cpu: req.body.cpu,
            ram: req.body.ram,
            hhp: req.body.hhp,
            mac_addres: req.body.mac_addres,
            printer: req.body.printer,
            description: req.body.description,
            bar_code: req.body.bar_code,
            category: {
              connect: { id: +req.body.categoryid },
            },
          };

          // Create product
          const product = await ProductModel.create(productData);

          return successResponse(
            res,
            201,
            product,
            "Product created successfully"
          );
        } catch (error) {
          return errorResponse(res, 500, error.message);
        }
      }
    } catch (error) {
      return errorResponse(res, 500, error.message);
    }
  }
}
