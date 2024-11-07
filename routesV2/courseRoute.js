import express from 'express';
import dotenv from 'dotenv';
import courseCtrl from '../controllersV2/courseController.js';
import {isLoggedin} from "../middlewares/isLoggedin.js";
import {authorize} from "../middlewares/auth.js";


const router = express.Router();

router.post('/',isLoggedin, authorize('admin', 'instructor'), courseCtrl.createCourse);
router.get('/', courseCtrl.getCourses);
router.get('/:id', courseCtrl.getCourseById);
router.put('/:id',isLoggedin, authorize('admin', 'instructor'), courseCtrl.updateCourse);
router.delete('/:id',isLoggedin, authorize('admin', 'instructor'), courseCtrl.deleteCourse);

export default router;