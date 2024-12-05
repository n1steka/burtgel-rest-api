import { BaseModel } from "./baseModel.js";

class UserModel extends BaseModel {
  table = "user";
}

export default new UserModel();
