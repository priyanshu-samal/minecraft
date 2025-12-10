// aiClient.rag.js
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { retrieveContext } = require('./rag/memoryManager');

if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing in .env');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const LLM = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

const { agentGraph } = require('./agentGraph');

async function thinker(name, state) {
  console.log(`🧠 ${name} is thinking using LangGraph...`);
  
  const inputs = {
    name: name,
    inventory: state.inventory || [],
    position: state.pos,
    nearbyBlocks: state.nearbyBlocks || [],
    profession: state.profession || 'Villager',
    memory: [], // Populated by graph
    rules: [], // Populated by graph
    plan: null,
    lastAction: null
  };

  try {
    const result = await agentGraph.invoke(inputs);
    console.log(`🧠 Plan:`, result.plan);
    return result.plan;
  } catch (err) {
    console.error("Graph execution failed:", err);
    return { action: "idle" };
  }
}

module.exports = { thinker };
