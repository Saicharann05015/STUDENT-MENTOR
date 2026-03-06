const { generateAIResponse } = require('../services/geminiService');
const ChatService = require('../services/chatService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Send a prompt to Gemini AI and get a response
// @route   POST /api/ai/chat
exports.aiChat = asyncHandler(async (req, res) => {
    const { message, chatId, context, level } = req.body;

    let history = [];
    let chatContext = context || 'general';
    let chat = null;

    // If chatId provided, load existing chat history and context
    if (chatId) {
        chat = await ChatService.getChatById(chatId, req.user.id);
        chatContext = chat.context || chatContext;
        // Limit history to the last 20 messages for context window efficiency
        history = chat.messages.slice(-20).map((msg) => ({
            role: msg.role,
            content: msg.content,
        }));
    }

    // Generate AI response with mentor prompt system
    const aiResponse = await generateAIResponse(message, {
        context: chatContext,
        level: level || null,
        history,
    });

    // If chatId provided, save both messages to the chat (reuse same object)
    if (chat) {
        chat.messages.push({ role: 'user', content: message });
        chat.messages.push({ role: 'assistant', content: aiResponse });
        await chat.save();
    }

    ApiResponse.success(res, {
        data: {
            message: aiResponse,
            chatId: chatId || null,
        },
        message: 'AI response generated',
    });
});

// @desc    Start a new AI chat session with initial message
// @route   POST /api/ai/chat/new
exports.newAiChat = asyncHandler(async (req, res) => {
    const { message, context, level, title } = req.body;

    const chatContext = context || 'general';

    // Generate AI response with mentor prompt system
    const aiResponse = await generateAIResponse(message, {
        context: chatContext,
        level: level || null,
    });

    // Create a new chat with both messages
    const chat = await ChatService.createChat(req.user.id, {
        title: title || message.substring(0, 50) + '...',
        context: chatContext,
    });

    chat.messages.push({ role: 'user', content: message });
    chat.messages.push({ role: 'assistant', content: aiResponse });
    await chat.save();

    ApiResponse.created(res, {
        data: {
            message: aiResponse,
            chatId: chat._id,
            chat,
        },
        message: 'New AI chat started',
    });
});
