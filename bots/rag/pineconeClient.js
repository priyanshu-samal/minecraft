const { Pinecone } = require("@pinecone-database/pinecone");
const client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = client.index(process.env.PINECONE_INDEX);

async function storeMemory(id, vector, metadata) {
  await index.upsert([
    {
      id,
      values: vector,
      metadata: {
        text: metadata.text || "",
        x: metadata.x || 0,
        y: metadata.y || 0,
        z: metadata.z || 0,
        type: metadata.type || "memory",
        agent: metadata.agent || "unknown",
        importance: metadata.importance || 1
      }
    }
  ]);
  console.log("🧠 Saved memory to Pinecone");
}

async function queryMemory(vector, topK = 5) {
  const res = await index.query({
    vector,
    topK,
    includeMetadata: true
  });
  return res.matches;
}

module.exports = { storeMemory, queryMemory };
