import express from "express";
import dotenv from "dotenv";
import { isLoggedin } from "../middlewares/isLoggedin.js";
import {authorize, protect} from "../middlewares/auth.js";
import userCtrl from "../controllersV2/userController.js";

const router = express.Router();

router.post("/",isLoggedin, authorize('admin'), userCtrl.createUserCtrl);
router.get("/:id", userCtrl.getUserById);
router.get("/",isLoggedin, authorize('admin', 'intructor'), userCtrl.getUsersCtrl);
router.put("/:id",isLoggedin, userCtrl.updateUserCtrl);
router.delete("/:id",isLoggedin, authorize('admin'), userCtrl.deleteUserCtrl);

export default router;