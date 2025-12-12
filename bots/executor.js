const { goals: { GoalNear } } = require('mineflayer-pathfinder');
const { Vec3 } = require('vec3');
const { ingestEvent } = require('./rag/memoryManager');
const { recordContribution, getBalance } = require('./economyManager');
const { spawnChild } = require('./reproductionManager');

/* safe chop and deposit executor */

function findBestLogAndStand(bot, maxDistance = 32) {
  const logBlock = bot.findBlock({ matching: b => b && b.name && b.name.includes('log'), maxDistance });
  if (!logBlock) return null;

  const neighbors = [ new Vec3(1,0,0), new Vec3(-1,0,0), new Vec3(0,0,1), new Vec3(0,0,-1) ];
  for (const n of neighbors) {
    const standPos = logBlock.position.plus(n);
    const blockAtStand = bot.blockAt(standPos);
    const blockBelow = bot.blockAt(standPos.offset(0,-1,0));
    const head = bot.blockAt(standPos.offset(0,1,0));
    if (!blockAtStand || blockAtStand.name !== 'air') continue;
    if (!blockBelow || blockBelow.name === 'air') continue;
    if (head && head.name !== 'air') continue;
    return { logBlock, standPos };
  }
  return { logBlock, standPos: null };
}

async function chopLogSafely(bot, logBlock, standPos) {
  try {
    const target = standPos ? standPos : logBlock.position;
    await bot.pathfinder.goto(new GoalNear(target.x + 0.5, target.y, target.z + 0.5, 1));
  } catch (err) {
    console.log('[executor] path failed', err);
    return false;
  }

  try {
    await bot.dig(logBlock);
    return true;
  } catch (err) {
    console.log('[executor] dig failed', err);
    return false;
  }
}

async function depositToChest(bot) {
  const chestBlock = bot.findBlock({ matching: b => b && b.name && b.name.includes('chest'), maxDistance: 32 });
  if (!chestBlock) {
    bot.chat('No chest nearby to deposit.');
    return false;
  }
  try {
    await bot.pathfinder.goto(new GoalNear(chestBlock.position.x + 0.5, chestBlock.position.y, chestBlock.position.z + 0.5, 1));
    const chest = await bot.openChest(chestBlock);
    let total = 0;
    for (const item of bot.inventory.items()) {
      if (!item || !item.name) continue;
      if (item.name.includes('log') || item.name.includes('plank')) {
        total += item.count;
        await chest.deposit(item.type, null, item.count).catch(()=>{});
        recordContribution(bot.username, item.name, item.count);
      }
    }
    chest.close();
    bot.chat(`Deposited ${total} items into chest.`);
    await ingestEvent({ agent: bot.username, type: 'deposit', text: `Deposited ${total} logs`, coords: bot.entity.position, importance: 5 });
    return true;
  } catch (e) {
    console.log('[executor] deposit failed', e);
    return false;
  }
}

async function executeAction(bot, intent) {
  if (!intent || !intent.action) return;

  if (intent.action === 'collect') {
    // target preference
    if (intent.target && intent.target.x != null) {
      const targetBlock = bot.blockAt(new Vec3(intent.target.x, intent.target.y, intent.target.z));
      if (targetBlock) {
        const maybe = findBestLogAndStand(bot, 48);
        const ok = await chopLogSafely(bot, targetBlock, maybe ? maybe.standPos : null);
        if (ok) await ingestEvent({ agent: bot.username, type: 'chop', text: `Chopped at ${targetBlock.position.x},${targetBlock.position.y},${targetBlock.position.z}`, coords: targetBlock.position, importance: 3 });
        return;
      }
    }

    const found = findBestLogAndStand(bot, 48);
    if (!found || !found.logBlock) {
      bot.chat('No trees found nearby.');
      await ingestEvent({ agent: bot.username, type: 'no_tree', text: 'No tree found', coords: bot.entity.position, importance: 1 });
      return;
    }
    const ok = await chopLogSafely(bot, found.logBlock, found.standPos);
    if (ok) await ingestEvent({ agent: bot.username, type: 'chop', text: `Chopped at ${found.logBlock.position.x},${found.logBlock.position.y},${found.logBlock.position.z}`, coords: found.logBlock.position, importance: 3 });
    return;
  }

  if (intent.action === 'deposit') {
    await depositToChest(bot);
    return;
  }

  if (intent.action === 'drop') {
    const itemsToDrop = bot.inventory.items().filter(i => i.name.includes('log') || i.name.includes('plank'));
    if (itemsToDrop.length === 0) {
      bot.chat('Nothing to drop.');
      return;
    }
    bot.chat('Dropping items...');
    for (const item of itemsToDrop) {
      await bot.toss(item.type, null, item.count).catch(err => console.log('Toss error', err));
    }
    await ingestEvent({ agent: bot.username, type: 'drop', text: `Dropped ${itemsToDrop.length} stacks`, coords: bot.entity.position, importance: 2 });
    return;
  }

  if (intent.action === 'move' && intent.target) {
    await bot.pathfinder.goto(new GoalNear(intent.target.x + 0.5, intent.target.y, intent.target.z + 0.5, 1));
    return;
  }

  if (intent.action === 'attack') {
    const entity = bot.nearestEntity(e => e.type === 'mob' && (e.name === 'zombie' || e.name === 'skeleton' || e.name === 'spider'));
    if (entity) {
      bot.chat(`Attacking ${entity.name}!`);
      await bot.pvp.attack(entity);
      await ingestEvent({ agent: bot.username, type: 'attack', text: `Attacked ${entity.name}`, coords: bot.entity.position, importance: 4 });
    } else {
      bot.chat('No enemies nearby.');
    }
    return;
  }

  if (intent.action === 'patrol') {
    const range = 10;
    const x = bot.entity.position.x + (Math.random() * range - range/2);
    const z = bot.entity.position.z + (Math.random() * range - range/2);
    bot.chat('Patrolling...');
    await bot.pathfinder.goto(new GoalNear(x, bot.entity.position.y, z, 1));
    return;
  }

  if (intent.action === 'reproduce') {
    const score = getBalance(bot.username);
    const cost = 50;
    if (score >= cost) {
      bot.chat(`I am reproducing! (Cost: ${cost}, Current: ${score})`);
      spawnChild(bot.username);
      // Deduct score manually? For now economyManager only adds. 
      // Ideally we should add a 'deduct' method but for prototype we just spawn.
      // Let's assume the manager handles it or we update it later.
      await ingestEvent({ agent: bot.username, type: 'reproduce', text: `Spawned a child`, coords: bot.entity.position, importance: 10 });
    } else {
      bot.chat(`Not enough credit to reproduce. Need ${cost}, have ${score}.`);
    }
    return;
  }

  bot.chat('Idle.');
}

module.exports = { executeAction };
