import express from 'express';
import dotenv from 'dotenv';
import authCtrl from "../controllersV2/authController.js";
import {isLoggedin} from "../middlewares/isLoggedin.js";

const router = express.Router();

router.post('/login', authCtrl.login);
router.post('/register', authCtrl.register);
router.post('/verify-email', authCtrl.verifyEmail);
router.post('/logout',isLoggedin, authCtrl.logout);
router.post('/forgot-password', authCtrl.forgotPassword);
router.post('/reset-password', authCtrl.resetPassword);

export default router;