import adminModel from "../model/adminModel.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import jwt from "jsonwebtoken";
import sendMail from "../utils/sendMail.js";
import { accessTokenOptions, refreshTokenOptions } from "../utils/jwt.js";
import dotenv from "dotenv";
import { errorResponse, successResponse } from "../middleware/Reponse.js";
dotenv.config();
import bcrypt from "bcrypt";
import { encryptPassword, comparePassword } from "../utils/password.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export class AdminController {
  async register(req, res, next) {
    try {
      const { phone, password } = req.body;
      if (!phone || !password) {
        return errorResponse(res, 400, "Please provide phone and password");
      }
      const existingAdmin = await prisma.admin.findFirst({
        where: { phone },
      });
      if (existingAdmin) {
        return errorResponse(
          res,
          400,
          "Admin already exists with this phone number"
        );
      }
      const hashedPassword = await encryptPassword(password);
      const admin = await prisma.admin.create({
        data: {
          phone,
          password: hashedPassword,
        },
      });

      const token = jwt.sign(
        { id: admin.id, phone: admin.phone },
        process.env.ACCESS_TOKEN
      );

      successResponse(res, 201, token, "Admin registered successfully");
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }

  async login(req, res, next) {
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        return errorResponse(res, 400, "Please enter phone and password");
      }
      const admin = await prisma.admin.findFirst({
        where: { phone },
      });
      if (!admin) {
        return errorResponse(res, 400, "Invalid phone or password");
      }
      const isPasswordMatched = await comparePassword(password, admin.password);
      if (!isPasswordMatched) {
        return errorResponse(res, 400, "Invalid phone or password");
      }
      const token = jwt.sign(
        { id: admin.id, phone: admin.phone },
        process.env.ACCESS_TOKEN
      );
      return res.status(200).json({
        success: true,
        token,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }

  // async logout(req, res, next) {
  //   try {
  //     res.cookie("access_token", "", { maxAge: 1 });
  //     res.cookie("refresh_token", "", { maxAge: 1 });
  //     res.status(200).json({
  //       success: true,
  //       message: "Logged out successfully",
  //     });
  //   } catch (error) {
  //     return next(new ErrorHandler(error.message, 400));
  //   }
  // }

  // async updateAccessToken(req, res, next) {
  //   try {
  //     const refresh_token = req.cookies.refresh_token;
  //     const message = "Could not refresh token";

  //     if (!refresh_token) {
  //       return next(new ErrorHandler(message, 400));
  //     }

  //     let decoded;
  //     try {
  //       decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN);
  //     } catch (err) {
  //       return next(new ErrorHandler("Invalid refresh token", 400));
  //     }

  //     if (!session) {
  //       return next(new ErrorHandler("Session not found", 400));
  //     }

  //     const user = JSON.parse(session);
  //     const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN, {
  //       expiresIn: "5m",
  //     });

  //     const newRefreshToken = jwt.sign(
  //       { id: user._id },
  //       process.env.REFRESH_TOKEN,
  //       { expiresIn: "3d" }
  //     );

  //     req.user = user;
  //     res.cookie("access_token", accessToken, accessTokenOptions);
  //     res.cookie("refresh_token", newRefreshToken, refreshTokenOptions);

  //     next();
  //   } catch (error) {
  //     return next(new ErrorHandler(error.message, 400));
  //   }
  // }

  // async getUserInfo(req, res, next) {
  //   try {
  //     const userId = req.user?._id;

  //     if (!userId) {
  //       return next(new ErrorHandler("User ID not found in request", 400));
  //     }

  //     const user = await getUserById(userId, res);

  //     if (!user) {
  //       return next(new ErrorHandler("User not found", 404));
  //     }

  //     res.status(200).json({ success: true, user });
  //   } catch (error) {
  //     return next(new ErrorHandler(error.message, 400));
  //   }
  // }

  // async socialAuth(req, res, next) {
  //   try {
  //     const { email, name, avatar } = req.body;
  //     const user = await adminModel.findEmail(email);
  //     if (!user) {
  //       const newUser = await prisma.user.create({
  //         data: {
  //           email,
  //           name,
  //           avatar,
  //           password: "",
  //           role: "user",
  //         },
  //       });
  //       const token = jwt.sign(
  //         { id: newUser.id, role: newUser.role, email: newUser.email },
  //         process.env.ACCESS_TOKEN
  //       );
  //       res.cookie("token", token);
  //       return res.status(200).json({
  //         success: true,
  //         token,
  //       });
  //     } else {
  //       const token = jwt.sign(
  //         { id: user.id, role: user.role, email: user.email },
  //         process.env.ACCESS_TOKEN
  //       );
  //       res.cookie("token", token);
  //       return res.status(200).json({
  //         success: true,
  //         token,
  //         user,
  //       });
  //     }
  //   } catch (error) {
  //     return next(new ErrorHandler(error.message, 400));
  //   }
  // }

  // async updateUserInfo(req, res, next) {
  //   try {
  //     const { name, email } = req.body;
  //     const userId = req.user?._id;

  //     if (!userId) {
  //       return next(new ErrorHandler("User ID not found in request", 400));
  //     }

  //     const user = await adminModel.findById(userId);
  //     if (!user) {
  //       return next(new ErrorHandler("User not found", 404));
  //     }

  //     if (email) {
  //       const isEmailExist = await adminModel.findOne({ email });
  //       if (isEmailExist && isEmailExist._id.toString() !== userId) {
  //         return next(new ErrorHandler(`${email} already exists`, 400));
  //       }
  //       user.email = email;
  //     }

  //     if (name) {
  //       user.name = name;
  //     }

  //     await user.save();

  //     res.status(200).json({ success: true, user });
  //   } catch (error) {
  //     return next(new ErrorHandler(error.message, 400));
  //   }
  // }

  // async updatePassword(req, res, next) {
  //   try {
  //     const { oldPassword, newPassword } = req.body;
  //     const userId = req.user?._id;

  //     if (!userId) {
  //       return next(new ErrorHandler("User ID not found in request", 400));
  //     }

  //     const user = await adminModel.findById(userId).select("+password");
  //     if (!user) {
  //       return next(new ErrorHandler("User not found", 400));
  //     }

  //     const isPasswordMatch = await user.comparePassword(oldPassword);
  //     if (!isPasswordMatch) {
  //       return next(new ErrorHandler("Old password is incorrect", 400));
  //     }

  //     user.password = newPassword;
  //     await user.save();

  //     return res.status(200).json({
  //       success: true,
  //       user,
  //     });
  //   } catch (error) {
  //     return next(new ErrorHandler(error.message, 400));
  //   }
  // }

  // async getAllUsers(req, res, next) {
  //   try {
  //     getAllUsersService(res);
  //   } catch (error) {
  //     return next(new ErrorHandler(error.message, 400));
  //   }
  // }

  // async deleteUser(req, res, next) {
  //   try {
  //     const { id } = req.params;
  //     const user = await adminModel.findById(id);

  //     if (!user) {
  //       return next(new ErrorHandler("User not found", 404));
  //     }

  //     await user.deleteOne();
  //     await redis.del(id);

  //     res.status(200).json({
  //       success: true,
  //       message: "User deleted successfully",
  //     });
  //   } catch (error) {
  //     return next(new ErrorHandler(error.message, 500));
  //   }
  // }

  // async activeUser(req, res, next) {
  //   try {
  //     const { activation_token, activation_code } = req.body;
  //     const newUser = jwt.verify(
  //       activation_token,
  //       process.env.ACTIVATION_SECRET
  //     );

  //     if (newUser.activationCode !== activation_code) {
  //       return next(new ErrorHandler("Хүчингүй код", 400));
  //     }
  //     const { name, email, password } = newUser.user;
  //     const existEmail = await adminModel.findEmail(email);
  //     if (existEmail) {
  //       return next(new ErrorHandler("И-мэйл хаяг бүртгэлтэй байна", 400));
  //     }
  //     const hashedPassword = await encryptPassword(password);
  //     const data = {
  //       name,
  //       email,
  //       password: hashedPassword,
  //       role: "user",
  //     };
  //     const user = await adminModel.create(data);
  //     successResponse(res, 201, user, "User created successfully");
  //   } catch (error) {
  //     return next(new ErrorHandler(error.message, 400));
  //   }
  // }
}
