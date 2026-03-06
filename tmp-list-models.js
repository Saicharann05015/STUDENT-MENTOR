require("dotenv").config({ path: "./backend/.env" });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.AI_API_KEY}`);
        const data = await response.json();
        console.log("AVAILABLE MODELS:");
        data.models.forEach(m => console.log(m.name));
    } catch (e) {
        console.error("Error fetching models:", e);
    }
}

listModels();
