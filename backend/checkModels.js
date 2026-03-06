require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function check() {
    try {
        const apiKey = process.env.AI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const res = await fetch(url);
        const models = data.models.filter(m => m.name.includes('gemini') && m.supportedGenerationMethods.includes('generateContent'));
        console.log(models.map(m => m.name).join('\n'));
    } catch (e) {
        console.error(e);
    }
}
check();
