const { embed } = require("./embeddings");
const { storeMemory, queryMemory } = require("./pineconeClient");

async function remember(text, coords={}) {
  const vec = await embed(text);

  await storeMemory(Date.now().toString(), vec, {
    text,
    x: coords.x ?? 0,
    y: coords.y ?? 0,
    z: coords.z ?? 0
  });
}

async function retrieveContext(query, nearCount=5) {
  const vec = await embed(query);
  const results = await queryMemory(vec, nearCount);
  return results.map(r => r.metadata.text);
}

async function ingestEvent({ agent, type, text, coords, importance }) {
  const vec = await embed(text);
  await storeMemory(Date.now().toString(), vec, {
    text,
    type,
    x: coords?.x || 0,
    y: coords?.y || 0,
    z: coords?.z || 0,
    agent,
    importance
  });
}

module.exports = { remember, retrieveContext, ingestEvent };
