import { Router } from "express";
import verifyUser from "../../middlewares/auth.middleware";
import { getTransactionHandler } from "../controllers/transaction.controller";


const router = Router()

router.use(verifyUser)

// routes
router.route("/").get(getTransactionHandler)


export default router