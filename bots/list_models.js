require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // Note: The Node.js SDK doesn't have a direct 'listModels' method exposed easily on the main class in all versions,
    // but we can try to use the model to generate content to test, or just try a known standard model.
    // However, let's try to use the `getGenerativeModel` with a model that usually exists to see if we can trigger a better error or just test 'gemini-pro'.
    
    // Actually, let's try to fetch the model list via REST if the SDK is obscure, but sticking to SDK is better.
    // The error message says "Call ListModels".
    // In the node SDK, it might not be straightforward.
    
    // Let's try 'gemini-pro' which is the standard GA model.
    console.log("Testing 'gemini-pro'...");
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Hello");
    console.log("Success with gemini-pro:", result.response.text());
  } catch (error) {
    console.error("Error with gemini-pro:", error.message);
  }

  try {
    console.log("Testing 'gemini-1.5-flash'...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log("Success with gemini-1.5-flash:", result.response.text());
  } catch (error) {
    console.error("Error with gemini-1.5-flash:", error.message);
  }
  try {
    console.log("Testing 'gemini-1.0-pro'...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
    const result = await model.generateContent("Hello");
    console.log("Success with gemini-1.0-pro:", result.response.text());
  } catch (error) {
    console.error("Error with gemini-1.0-pro:", error.message);
  }

  try {
    console.log("Testing 'gemini-1.5-pro'...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent("Hello");
    console.log("Success with gemini-1.5-pro:", result.response.text());
  } catch (error) {
    console.error("Error with gemini-1.5-pro:", error.message);
  }
}

listModels();
