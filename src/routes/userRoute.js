import express from "express";

import { UserController } from "../controller/userController.js";
const { register, activeUser, login, updateAccessToken, socialAuth, create } =
  new UserController();

const router = express.Router();

router.route("/registration").post(register);
router.route("/create/ter").post(create);
router.route("/active-user").post(activeUser);
router.route("/login-user").post(login);
// router.route("/refresh").get(updateAccessToken);
router.route("/social-auth").post(socialAuth);

export default router;
