import { Router } from "express";
import verifyUser from "../../middlewares/auth.middleware";
import { addTransactionHandler, getTransactionHandler } from "../controllers/transaction.controller";


const router = Router()

router.use(verifyUser)

// routes
router.route("/").get(getTransactionHandler)
router.route("/new/:accountId").post(addTransactionHandler)


export default router