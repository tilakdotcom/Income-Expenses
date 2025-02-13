import { Router } from "express";
import verifyUser from "../../middlewares/auth.middleware";
import { createAccountHandler, getAccountHandler } from "../controllers/account.controller";

const router = Router()

router.use(verifyUser)
// routes

router.route("/new").post(createAccountHandler)

router.route("/").get(getAccountHandler)

export default router