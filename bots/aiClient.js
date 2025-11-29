// aiClient.rag.js
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { retrieveContext } = require('./rag/memoryManager');

if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing in .env');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const LLM = genAI.getGenerativeModel({ model: process.env.LLM_MODEL || 'gemini-1.5-flash-latest' });

async function thinker(name, state) {
  const invSummary = (state.inventory || []).map(i => `${i.name}:${i.count}`).join(', ') || 'empty';
  const shortQuery = `Recent events near ${state.pos ? `${state.pos.x},${state.pos.z}` : 'unknown'}. Inventory: ${invSummary}`;
  const mems = await retrieveContext(shortQuery, 6);
  const memoryText = mems && mems.length ? mems.map(m => `- ${m.timestamp} ${m.agent}: ${m.type} / ${m.text}`).join('\n') : '(no memory)';

  const prompt = `
You are a Minecraft villager agent named ${name}.
Rules:
1) Do not stand on leaves; prefer ground-level trunks.
2) If inventory >= 10 logs, drop on ground
3) Return ONLY a single JSON object with keys action and optional target {x,y,z} and optional reason.

Memory:
${memoryText}

State:
Position: ${JSON.stringify(state.pos)}
Inventory: ${invSummary}

Valid outputs:
{"action":"collect"}
{"action":"collect","target":{"x":123,"y":64,"z":-12}}
{"action":"drop"}
{"action":"idle"}

Return only JSON.
`;

  try {
    const res = await LLM.generateContent(prompt);
    const txt = res.response.text().trim();
    // — After RAG recall and inside thinker — add this speech+reason return:

    // console.log(\`🧠 Thought: \${reasoning}\`); // reasoning is not defined here, removing or commenting out if it was intended to be parsed from JSON
    // bot.chat(reasoning);

    try { return JSON.parse(txt); } catch(e) { console.warn('LLM non-JSON; fallback', txt); }
  } catch (e) {
    console.error('LLM error', e);
  }

  // fallback rules
  const logs = (state.inventory || []).find(it => (it.name || '').includes('log'));
  if (logs && logs.count >= 10) return { action: 'drop' };
  return { action: 'collect' };
}

module.exports = { thinker };
