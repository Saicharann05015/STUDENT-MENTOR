const express = require('express');
const router = express.Router();
const {
    createChat,
    getUserChats,
    getChatById,
    sendMessage,
    deleteChat,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createChatSchema, sendMessageSchema } = require('../middleware/validators');

router.use(protect);

router.route('/').get(getUserChats).post(validate(createChatSchema), createChat);
router.route('/:id').get(getChatById).delete(deleteChat);
router.post('/:id/message', validate(sendMessageSchema), sendMessage);

module.exports = router;
