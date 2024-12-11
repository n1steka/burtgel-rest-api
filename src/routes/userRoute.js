import express from "express";

import { UserController } from "../controller/userController.js";
const {
  register,
  activeUser,
  login,
  updateAccessToken,
  socialAuth,
  create,
  getUsers,
  detail,
  update,
  deleteUser,
} = new UserController();

const router = express.Router();

router.route("/registration").post(register);
router.route("/create/ter/:id").put(create);
router.route("/active-user").post(activeUser);
router.route("/user/:id").get(detail);
router.route("/users").get(getUsers);
router.route("/user/delete/:id").delete(deleteUser);

router.route("/login-user").post(login);
// router.route("/refresh").get(updateAccessToken);
router.route("/social-auth").post(socialAuth);

export default router;
