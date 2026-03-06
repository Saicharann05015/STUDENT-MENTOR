require("dotenv").config({ path: "./.env" });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);

async function testModel(modelName) {
    try {
        console.log(`Testing model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say hello");
        console.log(`✅ ${modelName} SUCCESS:`, result.response.text());
        return true;
    } catch (e) {
        console.log(`❌ ${modelName} FAILED:`, e.message);
        return false;
    }
}

async function run() {
    const modelsToTest = [
        "gemini-2.5-flash-lite",
        "gemini-2.5-pro",
        "gemini-flash-latest",
        "gemini-pro-latest",
        "gemma-3-4b-it"
    ];

    for (const model of modelsToTest) {
        await testModel(model);
    }
}

run();
