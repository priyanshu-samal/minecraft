require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { embed } = require('./embeddings');
const { storeMemory } = require('./pineconeClient');

async function ingestRules() {
  console.log('📖 Reading rules...');
  const rulesPath = path.join(__dirname, 'rules.txt');
  const content = fs.readFileSync(rulesPath, 'utf-8');
  
  const rules = content.split('\n\n').filter(r => r.trim().length > 0);
  console.log(`Found ${rules.length} rule blocks.`);

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    console.log(`Processing rule ${i+1}...`);
    const vector = await embed(rule);
    if (!vector || vector.length === 0) {
      console.error('Failed to embed rule:', rule);
      continue;
    }
    
    await storeMemory(`rule-${i}`, vector, {
      text: rule,
      type: 'rule',
      importance: 10,
      timestamp: new Date().toISOString()
    });
  }
  console.log('✅ Rules ingestion complete.');
}

ingestRules();
