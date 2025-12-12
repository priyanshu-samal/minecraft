const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const FAMILY_TREE_FILE = path.join(__dirname, 'family_tree.json');

function loadFamilyTree() {
  try {
    if (!fs.existsSync(FAMILY_TREE_FILE)) return {};
    return JSON.parse(fs.readFileSync(FAMILY_TREE_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function saveFamilyTree(data) {
  try {
    fs.writeFileSync(FAMILY_TREE_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed to save family tree", e);
  }
}

function spawnChild(parentName) {
  const tree = loadFamilyTree();
  if (!tree[parentName]) tree[parentName] = [];
  
  const childNumber = tree[parentName].length + 1;
  const childName = `${parentName}_Child${childNumber}`;
  
  console.log(`👶 ${parentName} is having a baby! Welcome ${childName}!`);
  
  // Spawn new process
  const childProcess = spawn('node', ['index.js', childName], {
    cwd: __dirname,
    detached: true,
    stdio: 'ignore',
    shell: true
  });
  
  childProcess.unref(); // Allow parent to exit independent of child
  
  tree[parentName].push(childName);
  saveFamilyTree(tree);
  
  return childName;
}

module.exports = { spawnChild };
