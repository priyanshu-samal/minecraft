const { goals: { GoalNear } } = require('mineflayer-pathfinder');
const mcDataLib = require('minecraft-data');


async function executeIntent(bot, intent, state) {
const mcData = mcDataLib(bot.version);
if (intent.action === 'idle') return;


if (intent.action === 'move' && intent.targetPos) {
await bot.pathfinder.goto(new GoalNear(intent.targetPos.x, intent.targetPos.y, intent.targetPos.z, 1));
return;
}


// collect: simple collect using 'collect block' fallback - we just look for nearby logs
if (intent.action === 'collect') {
const logItem = bot.inventory.items().find(i => i.name && i.name.includes('log'));
// naive behavior: if have no logs, go chop nearby tree by walking to nearest log block
if (!logItem) {
const logBlock = bot.findBlock({ matching: b => b.name.includes('log'), maxDistance: 32 });
if (logBlock) {
await bot.pathfinder.goto(new GoalNear(logBlock.position.x, logBlock.position.y, logBlock.position.z, 1));
// we don't programmatically chop here — this is a TODO improvement
bot.chat('Found logs; please chop (manual or extend bot)');
} else {
bot.chat('No logs nearby');
}
}
return;
}


// deposit: find nearest chest and toss a fraction of log stack
if (intent.action === 'deposit') {
const chestBlock = bot.findBlock({ matching: b => b.name === 'chest', maxDistance: 32 });
if (!chestBlock) {
bot.chat('No chest nearby to deposit');
// fallback: drop the items at current location
await dropSome(bot, intent);
return;
}


await bot.pathfinder.goto(new GoalNear(chestBlock.position.x, chestBlock.position.y, chestBlock.position.z, 1));


// try to deposit by tossing items near chest (simple, robust)
await dropSome(bot, intent);
bot.chat('Deposited items (dropped near chest).');
return;
}


bot.chat('Intent not implemented: ' + JSON.stringify(intent));
}


async function dropSome(bot, intent) {
// choose a matching inventory item
const logs = bot.inventory.items().filter(i => i.name && (i.name.includes('log') || i.name.includes('plank')));
if (!logs || logs.length === 0) return;
const item = logs[0];
const amount = intent.amount || Math.max(1, Math.floor(item.count * 0.1));
// toss uses type id
try {
await bot.toss(item.type, amount);
} catch (e) {
console.error('Failed to toss', e);
}
}


module.exports = { executeIntent };