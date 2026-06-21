// ============================================
// VOIDFALL - Main Game Controller
// ============================================

let player = loadPlayer() || createNewPlayer();
let currentDungeonIndex = null;
let currentRoomIndex = 0;
let currentMonster = null;
let battleTimer = null;
let inBattleTransition = false;

const BATTLE_TICK_MS = 850; // pace of auto-battle exchanges shown to the player

function init() {
  // ensure currentHp is valid
  const stats = getTotalStats(player);
  if (player.currentHp == null || player.currentHp <= 0) player.currentHp = stats.hp;
  player.currentHp = Math.min(player.currentHp, stats.hp);

  applyOfflineProgress();

  renderAll();
  bindGlobalEvents();
  showDungeonSelectView();

  // autosave loop
  setInterval(() => savePlayer(player), 10000);
  window.addEventListener("beforeunload", () => savePlayer(player));
}

function renderAll() {
  renderHud(player);
  renderStats(player);
  renderEquipSlots(player, onEquipSlotClick);
  renderDungeonList(player, enterDungeon);
  renderInventory(player, { onEquip: onInventoryItemClick });
}

// ============================================
// Offline progress (idle gold while away, capped)
// ============================================
function applyOfflineProgress() {
  const last = player.lastSeenTimestamp || Date.now();
  const elapsedMs = Date.now() - last;
  const cappedMs = Math.min(elapsedMs, 1000 * 60 * 60 * 4); // cap at 4 hours
  if (cappedMs < 60000) return; // less than a minute, ignore

  const minutes = cappedMs / 60000;
  const dungeon = DUNGEONS[Math.max(0, player.unlockedDungeonIndex)];
  const goldPerMin = 1.2 * (dungeon.goldMult || 1) * (1 + player.level * 0.05);
  const earned = Math.round(goldPerMin * minutes);
  if (earned > 0) {
    player.gold += earned;
    setTimeout(() => showToast(`ขณะที่คุณไม่อยู่ ได้รับทองคำ ${fmtNum(earned)} จากการสำรวจ`), 600);
  }
}

// ============================================
// View switching
// ============================================
function showDungeonSelectView() {
  document.getElementById("dungeonSelectView").classList.remove("hidden");
  document.getElementById("battleStageView").classList.add("hidden");
  document.getElementById("resultOverlay").classList.add("hidden");
  stopBattleLoop();
  renderDungeonList(player, enterDungeon);
}

function showBattleStageView() {
  document.getElementById("dungeonSelectView").classList.add("hidden");
  document.getElementById("battleStageView").classList.remove("hidden");
}

// ============================================
// Dungeon flow
// ============================================
function enterDungeon(idx) {
  currentDungeonIndex = idx;
  currentRoomIndex = 0;
  const stats = getTotalStats(player);
  player.currentHp = stats.hp; // full heal on entry

  showBattleStageView();
  clearCombatLog();
  document.getElementById("stageDungeonName").textContent = DUNGEONS[idx].name;
  spawnRoom();
}

function spawnRoom() {
  const dungeon = DUNGEONS[currentDungeonIndex];
  document.getElementById("stageRoomIndicator").textContent =
    currentRoomIndex === ROOMS_PER_DUNGEON - 1
      ? `ห้องบอส (${ROOMS_PER_DUNGEON}/${ROOMS_PER_DUNGEON})`
      : `ห้อง ${currentRoomIndex + 1}/${ROOMS_PER_DUNGEON}`;

  currentMonster = generateMonster(dungeon, currentRoomIndex, player);
  setArenaCombatants(player, currentMonster);
  appendCombatLog(`พบ ${currentMonster.name}${currentMonster.isBoss ? " (บอส)" : ""}`);

  startBattleLoop();
}

function startBattleLoop() {
  stopBattleLoop();
  battleTimer = setInterval(runBattleTick, BATTLE_TICK_MS);
}
function stopBattleLoop() {
  if (battleTimer) clearInterval(battleTimer);
  battleTimer = null;
}

// We run the full simulateBattle once per "room" lazily isn't idle-friendly for animation,
// so instead we step the fight one exchange at a time using a persistent mini state.
let exchangeState = null;

function runBattleTick() {
  if (inBattleTransition) return;
  const dungeon = DUNGEONS[currentDungeonIndex];
  const stats = getTotalStats(player);

  if (!exchangeState || exchangeState.monster !== currentMonster) {
    exchangeState = {
      monster: currentMonster,
      monsterHp: currentMonster.hp,
      playerSpdAcc: 0,
      monsterSpdAcc: 0,
    };
  }

  exchangeState.playerSpdAcc += stats.spd;
  exchangeState.monsterSpdAcc += currentMonster.spd;

  let playerActed = false, monsterActed = false;

  if (exchangeState.playerSpdAcc >= 1 && exchangeState.monsterHp > 0) {
    exchangeState.playerSpdAcc -= 1;
    const result = resolveAttack(stats.atk, currentMonster.def, stats.crit);
    exchangeState.monsterHp = Math.max(0, exchangeState.monsterHp - result.damage);
    currentMonster.hp = exchangeState.monsterHp;
    playAttackAnim("player");
    setTimeout(() => spawnDamageText("monster", result.damage, result.isCrit), 190);
    updateHpBar("monster", currentMonster.hp, currentMonster.maxHp);
    appendCombatLog(`คุณโจมตี ${currentMonster.name} ${result.isCrit ? "(คริติคอล) " : ""}-${result.damage}`, result.isCrit ? "log-line-crit" : null);
    playerActed = true;
  }

  if (exchangeState.monsterHp <= 0) {
    setTimeout(() => onMonsterDefeated(), 500);
    return;
  }

  if (exchangeState.monsterSpdAcc >= 1) {
    exchangeState.monsterSpdAcc -= 1;
    const result = resolveAttack(currentMonster.atk, stats.def, 5);
    player.currentHp = Math.max(0, player.currentHp - result.damage);
    setTimeout(() => {
      playAttackAnim("monster");
      setTimeout(() => spawnDamageText("player", result.damage, result.isCrit), 190);
      updateHpBar("player", player.currentHp, stats.hp);
    }, playerActed ? 420 : 0);
    appendCombatLog(`${currentMonster.name} โจมตีคุณ ${result.isCrit ? "(คริติคอล) " : ""}-${result.damage}`, result.isCrit ? "log-line-crit" : null);
    monsterActed = true;
  }

  if (player.currentHp <= 0) {
    setTimeout(() => onPlayerDefeated(), monsterActed ? 700 : 100);
  }
}

function onMonsterDefeated() {
  stopBattleLoop();
  inBattleTransition = true;
  const dungeon = DUNGEONS[currentDungeonIndex];
  const isBoss = currentMonster.isBoss;

  player.stats.monstersKilled += 1;
  if (isBoss) player.stats.bossesKilled += 1;

  const gold = goldDropForKill(dungeon, isBoss);
  const exp = expDropForKill(dungeon, isBoss);
  player.gold += gold;

  appendCombatLog(`คุณกำจัด ${currentMonster.name} สำเร็จ! +${gold}g +${exp}exp`, "log-line-crit");

  const dropChance = isBoss ? 1 : 0.65;
  let loot = null;
  if (Math.random() < dropChance && player.inventory.length < 60) {
    loot = rollLoot(dungeon);
    player.inventory.push(loot);
    player.stats.itemsFound += 1;
  }

  const leveledUp = gainExp(player, exp, () => {
    showToast(`เลเวลอัพ! ตอนนี้คุณเลเวล ${player.level}`);
  });

  renderHud(player);
  renderStats(player);
  renderInventory(player, { onEquip: onInventoryItemClick });
  savePlayer(player);

  const isLastRoom = currentRoomIndex === ROOMS_PER_DUNGEON - 1;

  if (isLastRoom) {
    // dungeon cleared - possibly unlock next
    if (currentDungeonIndex === player.unlockedDungeonIndex && currentDungeonIndex < DUNGEONS.length - 1) {
      player.unlockedDungeonIndex = currentDungeonIndex + 1;
      player.stats.deepestDungeon = player.unlockedDungeonIndex;
      savePlayer(player);
    }
    showResultOverlay({
      win: true,
      title: "พิชิตดันเจี้ยน!",
      subtitle: `คุณเอาชนะ ${dungeon.name} ได้สำเร็จ`,
      loot,
      gold, exp,
      onContinue: () => { inBattleTransition = false; showDungeonSelectView(); },
    });
  } else {
    showResultOverlay({
      win: true,
      title: "ชนะการต่อสู้",
      subtitle: `กำจัด ${currentMonster.name} แล้ว`,
      loot,
      gold, exp,
      onContinue: () => {
        inBattleTransition = false;
        currentRoomIndex += 1;
        document.getElementById("resultOverlay").classList.add("hidden");
        spawnRoom();
      },
    });
  }
}

function onPlayerDefeated() {
  stopBattleLoop();
  inBattleTransition = true;
  appendCombatLog(`คุณพ่ายแพ้ต่อ ${currentMonster.name}...`, "log-line-defeat");
  showResultOverlay({
    win: false,
    title: "พ่ายแพ้",
    subtitle: "ตัวละครของคุณล้มลง แต่ฟื้นตัวได้เมื่อกลับเมือง",
    loot: null,
    onContinue: () => {
      inBattleTransition = false;
      const stats = getTotalStats(player);
      player.currentHp = Math.round(stats.hp * 0.5);
      savePlayer(player);
      showDungeonSelectView();
    },
  });
}

function showResultOverlay({ win, title, subtitle, loot, gold, exp, onContinue }) {
  const overlay = document.getElementById("resultOverlay");
  document.getElementById("resultTitle").textContent = title;
  document.getElementById("resultTitle").style.color = win ? "var(--success)" : "var(--danger)";
  let sub = subtitle;
  if (win && (gold || exp)) sub += ` · +${fmtNum(gold)} ทอง · +${fmtNum(exp)} EXP`;
  document.getElementById("resultSubtitle").textContent = sub;

  const lootContainer = document.getElementById("resultLoot");
  lootContainer.innerHTML = "";
  if (loot) {
    const el = document.createElement("div");
    el.className = "inv-slot";
    el.style.borderColor = RARITY[loot.rarity].color;
    el.style.boxShadow = `0 0 10px ${RARITY[loot.rarity].glow}`;
    el.innerHTML = iconHtml(loot.icon, RARITY[loot.rarity].color);
    el.addEventListener("mouseenter", (e) => showTooltip(loot, e, { inventoryItem: true }));
    el.addEventListener("mousemove", positionTooltip);
    el.addEventListener("mouseleave", hideTooltip);
    lootContainer.appendChild(el);
  }

  overlay.classList.remove("hidden");
  const btn = document.getElementById("resultContinueBtn");
  btn.textContent = win ? "ดำเนินต่อ" : "กลับเมือง";
  btn.onclick = () => {
    overlay.classList.add("hidden");
    onContinue();
  };
}

// ============================================
// Equipment interactions
// ============================================
function onEquipSlotClick(slot, item) {
  if (!item) return;
  // handled via tooltip "unequip" button mostly; click also unequips quickly
}

function onInventoryItemClick(item) {
  // quick-equip on click; tooltip provides finer actions
  equipItem(item);
}

function equipItem(item) {
  const prev = player.equipment[item.slot];
  player.equipment[item.slot] = item;
  player.inventory = player.inventory.filter(i => i.id !== item.id);
  if (prev) player.inventory.push(prev);

  const stats = getTotalStats(player);
  player.currentHp = Math.min(player.currentHp, stats.hp);

  renderStats(player);
  renderEquipSlots(player, onEquipSlotClick);
  renderInventory(player, { onEquip: onInventoryItemClick });
  savePlayer(player);
  showToast(`สวม ${item.name} แล้ว`);
  hideTooltip();
}

function unequipItem(slot) {
  const item = player.equipment[slot];
  if (!item) return;
  if (player.inventory.length >= 60) {
    showToast("คลังไอเทมเต็ม ไม่สามารถถอดได้");
    return;
  }
  player.equipment[slot] = null;
  player.inventory.push(item);
  renderStats(player);
  renderEquipSlots(player, onEquipSlotClick);
  renderInventory(player, { onEquip: onInventoryItemClick });
  savePlayer(player);
  hideTooltip();
}

function toggleLockItem(item) {
  item.locked = !item.locked;
  renderInventory(player, { onEquip: onInventoryItemClick });
  hideTooltip();
}

function sellItem(item) {
  const value = sellValue(item);
  player.inventory = player.inventory.filter(i => i.id !== item.id);
  player.gold += value;
  renderHud(player);
  renderInventory(player, { onEquip: onInventoryItemClick });
  savePlayer(player);
  showToast(`ขาย ${item.name} ได้ ${value}g`);
  hideTooltip();
}

function sellAllJunk() {
  const sellable = player.inventory.filter(i => !i.locked);
  if (sellable.length === 0) {
    showToast("ไม่มีไอเทมที่ขายได้ (ทั้งหมดถูกล็อกไว้)");
    return;
  }
  const total = sellable.reduce((s, i) => s + sellValue(i), 0);
  player.inventory = player.inventory.filter(i => i.locked);
  player.gold += total;
  renderHud(player);
  renderInventory(player, { onEquip: onInventoryItemClick });
  savePlayer(player);
  showToast(`ขายไอเทม ${sellable.length} ชิ้น ได้ ${fmtNum(total)}g`);
}

// ============================================
// Global event bindings
// ============================================
function bindGlobalEvents() {
  document.getElementById("retreatBtn").addEventListener("click", () => {
    stopBattleLoop();
    inBattleTransition = false;
    showDungeonSelectView();
  });

  document.getElementById("sellJunkBtn").addEventListener("click", sellAllJunk);

  document.getElementById("settingsBtn").addEventListener("click", () => {
    document.getElementById("settingsModal").classList.remove("hidden");
  });
  document.getElementById("closeSettingsBtn").addEventListener("click", () => {
    document.getElementById("settingsModal").classList.add("hidden");
  });
  document.getElementById("resetSaveBtn").addEventListener("click", () => {
    if (confirm("ยืนยันล้างข้อมูลเซฟทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
      wipeSave();
      location.reload();
    }
  });
  document.getElementById("exportSaveBtn").addEventListener("click", async () => {
    const data = JSON.stringify(player);
    try {
      await navigator.clipboard.writeText(data);
      showToast("คัดลอกข้อมูลเซฟแล้ว");
    } catch (e) {
      showToast("ไม่สามารถคัดลอกได้");
    }
  });

  window.__tooltipActionHandler = (act, item) => {
    if (act === "equip") equipItem(item);
    if (act === "lock") toggleLockItem(item);
    if (act === "sell") sellItem(item);
    if (act === "unequip") unequipItem(item.slot);
  };

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".equip-slot") && !e.target.closest(".inv-slot") && !e.target.closest(".tooltip")) {
      hideTooltip();
    }
  });
}

init();
