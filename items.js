// ============================================
// VOIDFALL - Item generation & inventory logic
// ============================================

let itemUid = 0;
function nextItemId() {
  itemUid += 1;
  return "it_" + Date.now().toString(36) + "_" + itemUid;
}

function rollRarity(dropTable) {
  const entries = RARITY_ORDER.map(r => [r, dropTable[r] || 0]);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [r, w] of entries) {
    if (roll < w) return r;
    roll -= w;
  }
  return "common";
}

function generateItem(dungeon, dropTable) {
  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)];
  const templates = ITEM_TEMPLATES[slot];
  const template = templates[Math.floor(Math.random() * templates.length)];
  const rarity = rollRarity(dropTable);
  const rarityInfo = RARITY[rarity];

  // item level roughly tied to dungeon's minLevel range
  const itemLevel = dungeon.minLevel + Math.floor(Math.random() * 5);

  const statBudget = (itemLevel * 1.8 + 4) * rarityInfo.mult;
  const stats = {};

  // Primary stat gets the bulk
  const primaryKey = template.primary;
  stats[primaryKey] = roundStat(primaryKey, statBudget * 0.65);

  // secondary stats - pick 1-2 random extras depending on rarity
  const extraCount = rarity === "common" ? 0 : rarity === "uncommon" ? 1 : rarity === "rare" ? 1 : 2;
  const possibleSecondary = ["atk", "def", "hp", "crit", "spd"].filter(k => k !== primaryKey);
  shuffleArray(possibleSecondary);
  for (let i = 0; i < extraCount; i++) {
    const key = possibleSecondary[i];
    stats[key] = roundStat(key, statBudget * (0.18 + Math.random() * 0.1));
  }

  return {
    id: nextItemId(),
    slot,
    name: template.name,
    icon: template.icon,
    rarity,
    itemLevel,
    stats,
    locked: false,
  };
}

function roundStat(key, value) {
  if (key === "crit" || key === "spd") {
    return Math.round(value * 10) / 10 / (key === "spd" ? 8 : 1);
  }
  return Math.max(1, Math.round(value));
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function statLabel(key) {
  return { atk: "พลังโจมตี", def: "ป้องกัน", hp: "พลังชีวิต", crit: "คริติคอล", spd: "ความเร็ว" }[key] || key;
}

function statValueDisplay(key, value) {
  if (key === "crit") return "+" + value + "%";
  if (key === "spd") return "+" + value.toFixed(2);
  return "+" + value;
}

function sellValue(item) {
  const rarityInfo = RARITY[item.rarity];
  return Math.max(2, Math.round(item.itemLevel * 1.5 * rarityInfo.mult));
}

function computeItemPower(item) {
  return Object.values(item.stats).reduce((s, v) => s + v, 0) * RARITY[item.rarity].mult;
}
