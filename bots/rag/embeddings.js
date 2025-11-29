const { GoogleGenerativeAI } = require("@google/generative-ai");
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function embed(text) {
  try {
    const model = genai.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values; // 3072-dim vector
  } catch (err) {
    console.error("❌ Embedding failed:", err.message);
    return []; // never crash thinking loop
  }
}

module.exports = { embed };
