const Chat = require('../models/Chat');
const { generateAIResponse } = require('./geminiService');

class ChatService {
    // Create a new chat session
    static async createChat(userId, { title, context }) {
        const chat = await Chat.create({
            user: userId,
            title: title || 'New Chat',
            context: context || 'general',
            messages: [],
        });
        return chat;
    }

    // Get all chats for a user
    static async getUserChats(userId, query = {}) {
        const { page = 1, limit = 20, context } = query;
        const filter = { user: userId };
        if (context) filter.context = context;

        const chats = await Chat.find(filter)
            .select('title context createdAt updatedAt')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ updatedAt: -1 });

        const total = await Chat.countDocuments(filter);
        return { chats, total, page: parseInt(page), pages: Math.ceil(total / limit) };
    }

    // Get single chat with messages
    static async getChatById(chatId, userId) {
        const chat = await Chat.findOne({ _id: chatId, user: userId });
        if (!chat) {
            throw Object.assign(new Error('Chat not found'), { statusCode: 404 });
        }
        return chat;
    }

    // Send a message and get AI response via Gemini
    static async sendMessage(chatId, userId, { content }) {
        const chat = await Chat.findOne({ _id: chatId, user: userId });
        if (!chat) {
            throw Object.assign(new Error('Chat not found'), { statusCode: 404 });
        }

        // Build history from existing messages, limited to last 20
        const history = chat.messages.slice(-20).map((msg) => ({
            role: msg.role,
            content: msg.content,
        }));

        // Add user message
        chat.messages.push({ role: 'user', content });

        // Get AI response from Gemini
        const aiResponse = await generateAIResponse(content, { history });
        chat.messages.push({ role: 'assistant', content: aiResponse });

        await chat.save();
        return chat;
    }

    // Delete a chat
    static async deleteChat(chatId, userId) {
        const chat = await Chat.findOneAndDelete({ _id: chatId, user: userId });
        if (!chat) {
            throw Object.assign(new Error('Chat not found'), { statusCode: 404 });
        }
        return { message: 'Chat deleted successfully' };
    }
}

module.exports = ChatService;
