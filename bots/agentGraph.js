const { StateGraph, START, END, Annotation } = require("@langchain/langgraph");
const { retrieveContext } = require("./rag/memoryManager");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// Define State using Annotation
const AgentState = Annotation.Root({
  name: Annotation,
  inventory: Annotation,
  position: Annotation,
  nearbyBlocks: Annotation,
  memory: Annotation,
  rules: Annotation,
  plan: Annotation,
  lastAction: Annotation,
  profession: Annotation,
  score: Annotation,
});

// --- Nodes ---

async function sense(state) {
  return { ...state };
}

async function retrieve_rules(state) {
  const query = `How to play minecraft? Current state: ${JSON.stringify(state.inventory)}`;
  const context = await retrieveContext(query, 3);
  return { rules: context };
}

async function planner(state) {
  const prompt = `
You are a Minecraft agent named ${state.name}.
Your Profession: ${state.profession || 'Villager'}

Your Goal:
- If Lumberjack: Gather wood, replant saplings.
- If Guard: Patrol nearby, attack zombies/skeletons.
- If Villager: Survive and explore.

Your Score (Social Credit): ${state.score || 0}
(Earn score by depositing resources! Cost to Reproduce: 50)

Context (Rules & Memories):
${state.rules.join('\n')}

Current State:
Position: ${JSON.stringify(state.position)}
Inventory: ${JSON.stringify(state.inventory)}
Nearby Blocks: ${JSON.stringify(state.nearbyBlocks)}

Decide on the next best action.
Rules:
1. If you see a log in "Nearby Blocks" and you don't have many logs, collect it.
2. If inventory is full of logs (>= 10), drop them.
3. If your score is > 50, you should REPRODUCE to expand the clan.
4. Otherwise, idle or explore.

Available actions:
- {"action": "collect", "target": {"x":..., "y":..., "z":...}} (to chop wood)
- {"action": "drop"} (if inventory full of logs)
- {"action": "attack"} (if Guard and enemy nearby)
- {"action": "patrol"} (if Guard and no enemy)
- {"action": "reproduce"} (if score > 50)
- {"action": "idle"}

Return ONLY the JSON object for the action.
`;

  try {
    const result = await model.generateContent(prompt);
    const txt = result.response.text().trim();
    const action = JSON.parse(txt.replace(/```json/g, '').replace(/```/g, ''));
    return { plan: action };
  } catch (e) {
    console.error("Planning failed", e);
    return { plan: { action: "idle" } };
  }
}

// --- Graph Definition ---

const workflow = new StateGraph(AgentState)
  .addNode("sense", sense)
  .addNode("retrieve_rules", retrieve_rules)
  .addNode("planner", planner)
  .addEdge(START, "sense")
  .addEdge("sense", "retrieve_rules")
  .addEdge("retrieve_rules", "planner")
  .addEdge("planner", END);

const app = workflow.compile();

module.exports = { agentGraph: app };
