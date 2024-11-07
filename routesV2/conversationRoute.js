import express from 'express';
import conversationCtrl from '../controllersV2/conversationController.js';
import {isLoggedin} from "../middlewares/isLoggedin.js";

const router = express.Router();

router.post('/',isLoggedin, conversationCtrl.createConversation);
router.get('/',isLoggedin, conversationCtrl.getConversations);
router.get('/:id',isLoggedin, conversationCtrl.getConversationByID);
router.put('/:id',isLoggedin, conversationCtrl.updateConversation);
router.delete('/:id',isLoggedin, conversationCtrl.deleteConversation);

export default router;