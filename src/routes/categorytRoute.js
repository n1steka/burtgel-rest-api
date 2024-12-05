import express from "express";
import { CategoryController } from "../controller/categoryController.js";
const router = express.Router();

const categoryController = new CategoryController();

router.get("/categorys", categoryController.getActivecategorys);
router.get("/allcategorys", categoryController.getAll);
router.post("/category", categoryController.create);
router.put("/category/:id", categoryController.update);
router.get("/category/:id", categoryController.detail);
router.delete("/category/:id", categoryController.delete);
router.get("/maincategorys", categoryController.getMainCategorys);

export default router;
