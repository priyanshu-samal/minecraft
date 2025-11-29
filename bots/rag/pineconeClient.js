require("dotenv").config();
const { Pinecone } = require("@pinecone-database/pinecone");

// CREATE CLIENT (v6 syntax)
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

// CONNECT INDEX
const index = pc.index(process.env.PINECONE_INDEX);

// ➤ STORE MEMORY
async function storeMemory(id, vector, metadata) {
  return index.upsert([
    {
      id,
      values: vector,
      metadata
    }
  ]);
}

// ➤ QUERY MEMORY
async function queryMemory(vector, topK = 5) {
  const result = await index.query({
    vector,
    topK,
    includeMetadata: true
  });

  return result.matches || [];
}

module.exports = { storeMemory, queryMemory };
