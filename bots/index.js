require('dotenv').config();
const { createBotInstance } = require('./botController');
const fs = require('fs');


const NUM = parseInt(process.env.NUM_BOTS || '3', 10);
const base = process.env.BOT_BASE_NAME || 'Villager';
for (let i = 0; i < NUM; i++) {
createBotInstance(`${base}_${i+1}`);
}


console.log(`Started ${NUM} bot(s)`);