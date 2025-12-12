require('dotenv').config();
const { createBotInstance } = require('./botController');

const NUM = parseInt(process.env.NUM_BOTS || '1', 10);
const base = process.env.BOT_BASE_NAME || 'Villager';

// Check for command line argument for single bot mode
const specificName = process.argv[2];

if (specificName) {
  createBotInstance(specificName);
  console.log(`🚀 Started specific bot: ${specificName}`);
} else {
  for (let i = 0; i < NUM; i++) {
    createBotInstance(`${base}_${i+1}`);
  }
  console.log(`🚀 Started ${NUM} bot(s)`);
}
