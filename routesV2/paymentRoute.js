import express from "express";
import dotenv from "dotenv";
import { isLoggedin } from "../middlewares/isLoggedin.js";
import {authorize, protect} from "../middlewares/auth.js";
import paymentCtrl from "../controllersV2/paymentController.js";

const router = express.Router();

router.post("/",isLoggedin, authorize('admin'), paymentCtrl.createPayment);
router.get("/:id", paymentCtrl.getPaymentById);
router.get("/",isLoggedin, authorize('admin'), paymentCtrl.getPayments);
router.put("/:id",isLoggedin, authorize('admin'), paymentCtrl.updatePayment);
router.delete("/:id",isLoggedin, authorize('admin'), paymentCtrl.deletePayment);

export default router;