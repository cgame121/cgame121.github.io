// ============================================
// VOIDFALL - Player state & stat computation
// ============================================

const SAVE_KEY = "voidfall_save_v1";

function createNewPlayer() {
  return {
    level: 1,
    exp: 0,
    gold: 0,
    unlockedDungeonIndex: 0, // can play DUNGEONS[0..unlockedDungeonIndex]
    equipment: {
      weapon: null, head: null, body: null, hands: null, feet: null, trinket: null,
    },
    inventory: [], // array of item objects
    currentHp: null, // set after computing maxHp
    lastSeenTimestamp: Date.now(),
    stats: {
      monstersKilled: 0,
      bossesKilled: 0,
      itemsFound: 0,
      deepestDungeon: 0,
    },
  };
}

function getPlayerBaseStats(level) {
  const lvl = level - 1;
  return {
    hp: Math.round(PLAYER_BASE.hp + LEVEL_GROWTH.hp * lvl),
    atk: Math.round(PLAYER_BASE.atk + LEVEL_GROWTH.atk * lvl),
    def: Math.round(PLAYER_BASE.def + LEVEL_GROWTH.def * lvl),
    crit: Math.round((PLAYER_BASE.crit + LEVEL_GROWTH.crit * lvl) * 10) / 10,
    spd: PLAYER_BASE.spd,
  };
}

function getEquipmentStats(player) {
  const total = { atk: 0, def: 0, hp: 0, crit: 0, spd: 0 };
  for (const slot of SLOTS) {
    const item = player.equipment[slot];
    if (!item) continue;
    for (const [k, v] of Object.entries(item.stats)) {
      total[k] = (total[k] || 0) + v;
    }
  }
  return total;
}

function getTotalStats(player) {
  const base = getPlayerBaseStats(player.level);
  const eq = getEquipmentStats(player);
  return {
    hp: base.hp + (eq.hp || 0),
    atk: base.atk + (eq.atk || 0),
    def: base.def + (eq.def || 0),
    crit: Math.min(75, base.crit + (eq.crit || 0)),
    spd: base.spd + (eq.spd || 0),
  };
}

function gainExp(player, amount, onLevelUp) {
  player.exp += amount;
  let leveled = false;
  while (player.exp >= expForLevel(player.level)) {
    player.exp -= expForLevel(player.level);
    player.level += 1;
    leveled = true;
  }
  if (leveled && onLevelUp) onLevelUp();
  return leveled;
}

function savePlayer(player) {
  player.lastSeenTimestamp = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(player));
  } catch (e) {
    console.warn("Save failed", e);
  }
}

function loadPlayer() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // basic shape repair in case of future schema additions
    if (!parsed.equipment) parsed.equipment = {};
    for (const slot of SLOTS) {
      if (parsed.equipment[slot] === undefined) parsed.equipment[slot] = null;
    }
    if (!parsed.inventory) parsed.inventory = [];
    if (!parsed.stats) parsed.stats = { monstersKilled: 0, bossesKilled: 0, itemsFound: 0, deepestDungeon: 0 };
    return parsed;
  } catch (e) {
    console.warn("Load failed", e);
    return null;
  }
}

function wipeSave() {
  localStorage.removeItem(SAVE_KEY);
}
