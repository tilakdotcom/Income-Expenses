import { Router } from "express";
import verifyUser from "../../middlewares/auth.middleware";
import { getDashboardHandler,addTransactionHandler, getTransactionHandler, transferMoneyHandler } from "../controllers/transaction.controller";


const router = Router()

router.use(verifyUser)

// routes
router.route("/").get(getTransactionHandler)
router.route("/new/:accountId").post(addTransactionHandler)
router.route("/tranfer").patch(transferMoneyHandler)
router.route("/dashboard").get(getDashboardHandler)

export default router