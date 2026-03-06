const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AI_API_KEY, AI_MODEL } = require('../config/env');
const { getMentorPrompt } = require('../utils/prompts');
const logger = require('../utils/logger');

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(AI_API_KEY);

// In-memory cache with eviction
const aiCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 100;
const AI_TIMEOUT_MS = 30000; // 30 second timeout for AI calls

/**
 * Evict expired cache entries and enforce max size.
 */
const cleanCache = () => {
    const now = Date.now();
    for (const [key, value] of aiCache) {
        if (now - value.timestamp > CACHE_TTL) {
            aiCache.delete(key);
        }
    }
    // If still over limit, remove oldest entries
    if (aiCache.size > MAX_CACHE_SIZE) {
        const entries = [...aiCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toRemove = aiCache.size - MAX_CACHE_SIZE;
        for (let i = 0; i < toRemove; i++) {
            aiCache.delete(entries[i][0]);
        }
    }
};

/**
 * Generate an AI response from Google Gemini using the mentor prompt system.
 * @param {string} prompt - The user's message/prompt
 * @param {Object} options - Optional configuration
 * @param {string} options.context - Chat context ('general', 'skill-diagnosis', 'roadmap', 'doubt-solving')
 * @param {string} options.level - Student level ('beginner', 'intermediate', 'advanced', 'expert')
 * @param {Array}  options.history - Chat history [{ role, content }]
 * @param {string} options.customInstruction - Override system instruction entirely
 * @param {number} options.maxTokens - Limit response length
 * @returns {Promise<string>} AI-generated response text
 */
const generateAIResponse = async (prompt, options = {}) => {
    const { context = 'general', level = null, history = [], customInstruction = '', maxTokens = 1000 } = options;

    if (!AI_API_KEY) {
        throw Object.assign(new Error('AI API key is not configured'), { statusCode: 500 });
    }

    // 1. Check Cache (only for non-history requests for reliability)
    const cacheKey = `${context}-${level}-${customInstruction}-${prompt}`;
    if (history.length === 0 && aiCache.has(cacheKey)) {
        const cached = aiCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            logger.info(`Gemini [${context}] response served from cache`);
            return cached.data;
        }
        // Expired entry — remove it
        aiCache.delete(cacheKey);
    }

    try {
        // Build system instruction from mentor prompt system
        const systemInstruction = customInstruction || getMentorPrompt(context, level);

        const modelConfig = {
            model: AI_MODEL || 'gemini-2.5-flash-lite',
            systemInstruction,
        };

        // If the prompt strictly requires JSON (like Roadmaps/Diagnoses do through customInstructions)
        if (options.isJson) {
            modelConfig.generationConfig = {
                responseMimeType: 'application/json',
                maxOutputTokens: maxTokens,
            };
        } else {
            modelConfig.generationConfig = {
                maxOutputTokens: maxTokens,
            };
        }

        const model = genAI.getGenerativeModel(modelConfig);

        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI request timed out after 30 seconds')), AI_TIMEOUT_MS)
        );

        let response;

        // 2. Optimization: Use generateContent for one-off requests to reduce overhead
        if (history.length === 0) {
            const result = await Promise.race([
                model.generateContent(prompt),
                timeoutPromise,
            ]);
            response = result.response.text();
        } else {
            // Build chat history in Gemini format
            const geminiHistory = history.map((msg) => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            }));

            const chat = model.startChat({
                history: geminiHistory,
            });

            const result = await Promise.race([
                chat.sendMessage(prompt),
                timeoutPromise,
            ]);
            response = result.response.text();
        }

        // 3. Store in cache and clean up
        if (history.length === 0) {
            cleanCache(); // Evict expired/excess entries before adding new ones
            aiCache.set(cacheKey, { data: response, timestamp: Date.now() });
        }

        logger.info(`Gemini [${context}/${level || 'auto'}] response generated (${response.length} chars)`);
        return response;
    } catch (error) {
        logger.error(`Gemini API error: ${error.message}`);
        throw Object.assign(
            new Error('Failed to generate AI response. Please try again later.'),
            { statusCode: 502 }
        );
    }
};

module.exports = { generateAIResponse };
