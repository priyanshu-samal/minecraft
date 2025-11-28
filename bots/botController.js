const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const mcDataLib = require('minecraft-data');
const { thinker } = require('./aiClient');
const executor = require('./executor');
const rules = require('./rules');
const fs = require('fs');


function createBotInstance(username) {
const bot = mineflayer.createBot({
host: process.env.SERVER_HOST || 'localhost',
port: parseInt(process.env.SERVER_PORT || '25565', 10),
username
});


bot.loadPlugin(pathfinder);


bot.on('spawn', () => {
const mcData = mcDataLib(bot.version);
const defaultMove = new Movements(bot, mcData);
bot.pathfinder.setMovements(defaultMove);
bot.chat(`Hello, I am ${username}`);


// main loop
const interval = parseInt(process.env.DECISION_INTERVAL_MS || '90000', 10);
setInterval(async () => {
try {
const state = gatherState(bot);
const intent = await thinker(username, state);
if (!intent) return;
const approved = rules.validateIntent(username, state, intent);
if (!approved.allowed) {
bot.chat(`Action blocked by rules: ${approved.reason}`);
return;
}
await executor.executeIntent(bot, intent, state);
} catch (err) {
console.error('Decision loop error', err);
}
}, interval);
});


bot.on('error', (err) => console.error('Bot error', err));
bot.on('end', () => console.log(`${username} disconnected`));
}


function gatherState(bot) {
// lightweight state for prompt. Keep it small to save tokens
const inv = bot.inventory.items().map(i => ({name: i.name, count: i.count, id: i.type}));
const pos = bot.entity.position;
// try to find a nearby chest
const chest = bot.findBlock({ matching: b => b.name === 'chest', maxDistance: 20 });
return {
inventory: inv,
pos: pos ? {x: pos.x, y: pos.y, z: pos.z} : null,
chestPos: chest ? {x: chest.position.x, y: chest.position.y, z: chest.position.z} : null
};
}


module.exports = { createBotInstance };