const ChatService = require('../services/chatService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Create a new chat session
// @route   POST /api/v1/chat
exports.createChat = asyncHandler(async (req, res) => {
    const chat = await ChatService.createChat(req.user.id, req.body);
    ApiResponse.created(res, { data: chat, message: 'Chat session created' });
});

// @desc    Get all chats for the user
// @route   GET /api/v1/chat
exports.getUserChats = asyncHandler(async (req, res) => {
    const result = await ChatService.getUserChats(req.user.id, req.query);
    ApiResponse.success(res, { data: result, message: 'Chats retrieved' });
});

// @desc    Get single chat by ID
// @route   GET /api/v1/chat/:id
exports.getChatById = asyncHandler(async (req, res) => {
    const chat = await ChatService.getChatById(req.params.id, req.user.id);
    ApiResponse.success(res, { data: chat, message: 'Chat retrieved' });
});

// @desc    Send a message in a chat
// @route   POST /api/v1/chat/:id/message
exports.sendMessage = asyncHandler(async (req, res) => {
    const chat = await ChatService.sendMessage(req.params.id, req.user.id, req.body);
    ApiResponse.success(res, { data: chat, message: 'Message sent' });
});

// @desc    Delete a chat
// @route   DELETE /api/v1/chat/:id
exports.deleteChat = asyncHandler(async (req, res) => {
    const result = await ChatService.deleteChat(req.params.id, req.user.id);
    ApiResponse.success(res, { data: result, message: 'Chat deleted' });
});
