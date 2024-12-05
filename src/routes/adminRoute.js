import express from "express";
import { AdminController } from "../controller/adminController.js";
const { register, login } = new AdminController();

const router = express.Router();

router.route("/admin-registration").post(register);
// router.route("/active-user").post(activeUser);
router.route("/admin-login").post(login);
// router.route("/refresh").get(updateAccessToken);
// router.route("/social-auth").post(socialAuth);

export default router;
