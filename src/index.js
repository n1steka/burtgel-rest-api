import express from "express";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import routes from "./routes/index.js";
import cors from "cors";
import logger from "morgan";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "drzymx72n",
  api_key: "663325969529548",
  api_secret: "AjDUnDrCCMii_OqZOveUjeQPQ5U",
  secure: true,
});

dotenv.config();
const app = express();

app.use(cors("*"));
app.use(logger("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Swagger API",
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:8080/api",
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api", routes);

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
