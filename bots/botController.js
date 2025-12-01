require('dotenv').config();
const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const mcDataLib = require('minecraft-data');
const { thinker } = require('./aiClient');
const { executeAction } = require('./executor');

function createBotInstance(name) {
  const bot = mineflayer.createBot({
    host: process.env.SERVER_HOST || 'localhost',
    port: Number(process.env.SERVER_PORT) || 25565,
    username: name
  });

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    const mcData = mcDataLib(bot.version);
    bot.pathfinder.setMovements(new Movements(bot, mcData));
    console.log(`🔥 ${name} is online at`, bot.entity.position);
    bot.chat('Hello — I am alive.');
    startAILoop(bot, name);
  });

  bot.on('end', () => console.log(`❌ Bot disconnected (${name})`));
  bot.on('error', (err) => console.error(`Bot error (${name}):`, err));
  return bot;
}

async function startAILoop(bot, name) {
  const interval = Number(process.env.DECISION_INTERVAL_MS) || 30000;
  console.log(`🧠 AI loop started for ${name} (every ${interval} ms)`);

  // give world load time then start
  setTimeout(() => {
    setInterval(async () => {
      try {
        const nearbyLogs = bot.findBlocks({
          matching: b => b && b.name && b.name.includes('log'),
          maxDistance: 16,
          count: 5
        });
        const nearbyBlocks = nearbyLogs.map(p => {
          const b = bot.blockAt(p);
          return { name: b.name, position: { x: b.position.x, y: b.position.y, z: b.position.z } };
        });

        const state = {
          inventory: bot.inventory.items().map(i => ({ name: i.name, count: i.count, type: i.type })),
          pos: bot.entity && bot.entity.position ? { x: Math.floor(bot.entity.position.x), y: Math.floor(bot.entity.position.y), z: Math.floor(bot.entity.position.z) } : null,
          nearbyBlocks: nearbyBlocks
        };

        console.log(`=> Thinking for ${name} (pos: ${state.pos ? `${state.pos.x},${state.pos.y},${state.pos.z}` : 'unknown'})`);
        const intent = await thinker(name, state);
        console.log(`🧾 Intent for ${name}:`, intent);

        if (intent) await executeAction(bot, intent);
      } catch (err) {
        console.error('AI loop error:', err);
      }
    }, interval);
  }, 2000);
}

module.exports = { createBotInstance };
