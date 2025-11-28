// very small rule engine. Expand as needed.


function validateIntent(name, state, intent) {
// Example rule: can't destroy blocks (no grief)
if (intent.action === 'destroy' || intent.action === 'break') {
return { allowed: false, reason: 'Breaking blocks is forbidden' };
}


// tax rule example: require deposit <= inventory
if (intent.action === 'deposit') {
const item = state.inventory.find(i => i.name.includes('log') || i.name.includes('plank'));
const invCount = item ? item.count : 0;
if ((intent.amount || 0) > invCount) {
return { allowed: false, reason: 'Not enough items to deposit' };
}
}


return { allowed: true };
}


module.exports = { validateIntent };