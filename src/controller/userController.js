import userModel from "../model/userModel.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import jwt from "jsonwebtoken";
import sendMail from "../utils/sendMail.js";
import { sendToken } from "../utils/jwt.js";
import { accessTokenOptions, refreshTokenOptions } from "../utils/jwt.js";
import dotenv from "dotenv";
import { errorResponse, successResponse } from "../middleware/Reponse.js";
dotenv.config();
import bcrypt from "bcrypt";
import { encryptPassword, comparePassword } from "../utils/password.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class UserController {
  async register(req, res, next) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return errorResponse(res, 400, "Email, password and name are required");
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (existingUser) {
        return errorResponse(res, 400, "Email already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        email,
        password: hashedPassword,
        name,
      };

      const createUser = await prisma.user.create({
        data: user,
      });

      successResponse(res, 201, createUser, "User registered successfully");
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }

  async detail(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userModel.get(+id);
      successResponse(res, 200, user, "User detail fetched successfully");
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }

  async getUsers(req, res, next) {
    try {
      let where = {};
      if (req.query.name) {
        where.name = {
          contains: req.query.name,
        };
      }
      if (req.query.email) {
        where.email = {
          contains: req.query.email,
        };
      }
      const users = await userModel.list({
        where,
        page: req.query.page || 1,
        pageSize: req.query.pageSize || 10,
        orderBy: {
          createdat: "desc",
        },
      });
      console.log(users);
      successResponse(res, 200, users, "Users fetched successfully");
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }

  async create(req, res) {
    try {
      const { id } = req.params;
      const { email, password, name, role } = req.body;

      const hashedPassword = await bcrypt.hash(password, 10);
      const userData = {
        email,
        password: hashedPassword,
        name,
        role,
      };
      if (id === "new") {
        const createUser = await prisma.user.create({
          data: userData,
        });
        successResponse(res, 201, createUser, "User created successfully");
      } else {
        const updateUser = await prisma.user.update({
          where: {
            id: parseInt(id),
          },
          data: userData,
        });
        successResponse(res, 200, updateUser, "User updated successfully");
      }
    } catch (error) {
      console.log(error);
      return errorResponse(res, 500, error.message);
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const deleteUser = await prisma.user.delete({
        where: {
          id: parseInt(id),
        },
      });
      successResponse(res, 200, deleteUser, "User deleted successfully");
    } catch (error) {
      console.log(error);
      return errorResponse(res, 500, error.message);
    }
  }

  async activeUser(req, res, next) {
    try {
      const { activation_token, activation_code } = req.body;
      const newUser = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET
      );

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Хүчингүй код", 400));
      }
      const { name, email, password } = newUser.user;
      const existEmail = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });
      if (existEmail) {
        return next(new ErrorHandler("И-мэйл хаяг бүртгэлтэй байна", 400));
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "user",
        },
      });
      successResponse(res, 201, user, "User created successfully");
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return errorResponse(res, 400, "Please enter email and password");
      }

      const user = await userModel.findEmail(email);
      console.log(user);
      if (!user) {
        return errorResponse(res, 400, "Invalid email or password");
      }

      const isPasswordMatched = await comparePassword(password, user.password);

      if (!isPasswordMatched) {
        return errorResponse(res, 400, "Invalid email or password");
      }
      const token = jwt.sign(
        { id: user._id, role: user.role, email: user.email },
        process.env.ACCESS_TOKEN
      );

      // successResponse(res, 200, token, "Login successful");
      return res.status(200).json({
        success: true,
        token,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }

  async logout(req, res, next) {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }

  async updateAccessToken(req, res, next) {
    try {
      const refresh_token = req.cookies.refresh_token;
      const message = "Could not refresh token";

      if (!refresh_token) {
        return next(new ErrorHandler(message, 400));
      }

      let decoded;
      try {
        decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN);
      } catch (err) {
        return next(new ErrorHandler("Invalid refresh token", 400));
      }

      if (!session) {
        return next(new ErrorHandler("Session not found", 400));
      }

      const user = JSON.parse(session);
      const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN, {
        expiresIn: "5m",
      });

      const newRefreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN,
        { expiresIn: "3d" }
      );

      req.user = user;
      res.cookie("access_token", accessToken, accessTokenOptions);
      res.cookie("refresh_token", newRefreshToken, refreshTokenOptions);

      next();
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }

  async getUserInfo(req, res, next) {
    try {
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User ID not found in request", 400));
      }

      const user = await getUserById(userId, res);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      res.status(200).json({ success: true, user });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }

  async socialAuth(req, res, next) {
    try {
      const { email, name, avatar } = req.body;
      const user = await userModel.findEmail(email);
      if (!user) {
        const newUser = await prisma.user.create({
          data: {
            email,
            name,
            avatar,
            password: "",
            role: "user",
          },
        });
        const token = jwt.sign(
          { id: newUser.id, role: newUser.role, email: newUser.email },
          process.env.ACCESS_TOKEN
        );
        res.cookie("token", token);
        return res.status(200).json({
          success: true,
          token,
        });
      } else {
        const token = jwt.sign(
          { id: user.id, role: user.role, email: user.email },
          process.env.ACCESS_TOKEN
        );
        res.cookie("token", token);
        return res.status(200).json({
          success: true,
          token,
          user,
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }

  async updateUserInfo(req, res, next) {
    try {
      const { name, email } = req.body;
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User ID not found in request", 400));
      }

      const user = await userModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      if (email) {
        const isEmailExist = await userModel.findOne({ email });
        if (isEmailExist && isEmailExist._id.toString() !== userId) {
          return next(new ErrorHandler(`${email} already exists`, 400));
        }
        user.email = email;
      }

      if (name) {
        user.name = name;
      }

      await user.save();

      res.status(200).json({ success: true, user });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }

  async updatePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User ID not found in request", 400));
      }

      const user = await userModel.findById(userId).select("+password");
      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }

      const isPasswordMatch = await user.comparePassword(oldPassword);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Old password is incorrect", 400));
      }

      user.password = newPassword;
      await user.save();

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }

  async getAllUsers(req, res, next) {
    try {
      getAllUsersService(res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userModel.get(+id);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      await userModel.delete(+id);
      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
}
