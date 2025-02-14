import { Router } from "express";
import verifyUser from "../../middlewares/auth.middleware";
import { addAmountHandler, createAccountHandler, getAccountHandler } from "../controllers/account.controller";

const router = Router()

router.use(verifyUser)
// routes

router.route("/new").post(createAccountHandler)

router.route("/").get(getAccountHandler)

router.route("/add-amount/:accountId").patch(addAmountHandler)

export default router