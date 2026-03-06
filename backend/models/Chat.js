const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const chatSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            default: 'New Chat',
        },
        messages: [messageSchema],
        context: {
            type: String,
            enum: ['general', 'skill-diagnosis', 'roadmap', 'doubt-solving'],
            default: 'general',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Cap messages at 200 to prevent unbounded document growth
const MAX_MESSAGES = 200;
chatSchema.pre('save', function (next) {
    if (this.messages.length > MAX_MESSAGES) {
        this.messages = this.messages.slice(-MAX_MESSAGES);
    }
    next();
});

module.exports = mongoose.model('Chat', chatSchema);

