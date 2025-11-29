const { embed } = require("./embeddings");
const { storeMemory, queryMemory } = require("./pineconeClient");

// Save experience to long-term memory
async function remember(text) {
  const vector = await embed(text);
  await storeMemory(Date.now().toString(), vector, { text });
}

// Retrieve similar memories for context (RAG)
async function retrieveContext(query, topK = 5) {
  const vector = await embed(query);
  const matches = await queryMemory(vector, topK);   // <--- THIS WORKS
  return matches.map(m => m.metadata.text);
}

module.exports = { remember, retrieveContext };
