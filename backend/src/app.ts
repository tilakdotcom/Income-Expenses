import dotEnv from "dotenv";
dotEnv.config({
  path: "./.env",
});
import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { CORS_ORIGIN } from "./constants/getEnv";
import errorHandler from "./middlewares/errorHandler.middleware";
const app: Express = express();

//middlewares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

//cors middleware
const corsOptions: cors.CorsOptions = {
  origin: CORS_ORIGIN,
  credentials: true,
};

app.use(cors(corsOptions));

//cookie middleware
app.use(cookieParser());

// import routes and declaratio
import { routes } from "./core/routes/1index";
//  use routes
app.use("/api/v1/health", routes.healthRoutes);
app.use("/api/v1/auth", routes.authRoutes);
app.use("/api/v1/user", routes.userRoutes);
app.use("/api/v1/session", routes.sessionRoutes);
app.use("/api/v1/account", routes.accountRoutes);
app.use("/api/v1/transaction", routes.transactionRoutes);


app.use(errorHandler);

export { app };
