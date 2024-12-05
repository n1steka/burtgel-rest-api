import { BaseModel } from "./baseModel.js";

class ProductModel extends BaseModel {
  table = "products";
}


export default new ProductModel()
