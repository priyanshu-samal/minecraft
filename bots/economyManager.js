const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'economy.json');

function loadDb() {
  try {
    if (!fs.existsSync(DB_FILE)) return {};
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.error("Failed to load economy DB", e);
    return {};
  }
}

function saveDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed to save economy DB", e);
  }
}

function recordContribution(agentName, itemType, count) {
  const db = loadDb();
  if (!db[agentName]) db[agentName] = { score: 0, items: {} };
  
  if (!db[agentName].items[itemType]) db[agentName].items[itemType] = 0;
  db[agentName].items[itemType] += count;
  
  // Scoring rules: Logs/Planks = 1, others = 1
  // We can make this complex later
  const points = count; 
  db[agentName].score += points;
  
  saveDb(db);
  console.log(`💰 ${agentName} earned ${points} credits! Total: ${db[agentName].score}`);
}

function getBalance(agentName) {
  const db = loadDb();
  return db[agentName] ? db[agentName].score : 0;
}

module.exports = { recordContribution, getBalance };
