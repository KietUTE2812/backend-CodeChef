import express from 'express';
import moduleCtrl from '../controllersV2/moduleController.js';
import {isLoggedin} from "../middlewares/isLoggedin.js";
import {authorize} from "../middlewares/auth.js";


const router = express.Router();

router.get('/', moduleCtrl.getModules);
router.get('/:id',isLoggedin, moduleCtrl.getModule);
router.post('/',isLoggedin, authorize('admin', 'instructor'), moduleCtrl.createModule);
router.put('/:id',isLoggedin, authorize('admin', 'instructor'), moduleCtrl.updateModule);
router.delete('/:id',isLoggedin, authorize('admin', 'instructor'), moduleCtrl.deleteModule);

export default router;