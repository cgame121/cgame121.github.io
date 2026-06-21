// ============================================
// VOIDFALL - UI Rendering
// ============================================

const ICONS = {
  blade: `<svg viewBox="0 0 24 24"><path d="M4 20L16 8M16 8l3-3M16 8l1.5 1.5M19 5l1.5 1.5M4 20l2-5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
  staff: `<svg viewBox="0 0 24 24"><path d="M12 21V5M12 5a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
  helm: `<svg viewBox="0 0 24 24"><path d="M4 14c0-5 3.5-9 8-9s8 4 8 9v3H4v-3z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/><path d="M4 14h16" stroke="currentColor" stroke-width="1.8"/></svg>`,
  armor: `<svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>`,
  gloves: `<svg viewBox="0 0 24 24"><path d="M7 21V11a2 2 0 114 0v3M11 14v-5a2 2 0 114 0v5M15 14v-3a2 2 0 114 0v6c0 3-2 5-5 5H9a4 4 0 01-4-4v-3l2-2" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  boots: `<svg viewBox="0 0 24 24"><path d="M8 3v9l-5 4v3h17c0-4-3-5-6-6V3H8z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>`,
  gem: `<svg viewBox="0 0 24 24"><path d="M6 9l6-6 6 6-6 12-6-12z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/><path d="M6 9h12M9 9l3 12M15 9l-3 12" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`,
};

function iconHtml(icon, color) {
  return `<span class="item-icon" style="color:${color}">${ICONS[icon] || ""}</span>`;
}

function fmtNum(n) {
  return Math.round(n).toLocaleString("en-US");
}

// ---------- HUD ----------
function renderHud(player) {
  document.getElementById("hudLevel").textContent = player.level;
  document.getElementById("hudGold").textContent = fmtNum(player.gold);
  const pct = Math.min(100, (player.exp / expForLevel(player.level)) * 100);
  document.getElementById("hudExpFill").style.width = pct + "%";
}

// ---------- Stats panel ----------
function renderStats(player) {
  const s = getTotalStats(player);
  document.getElementById("statHp").textContent = fmtNum(s.hp);
  document.getElementById("statAtk").textContent = fmtNum(s.atk);
  document.getElementById("statDef").textContent = fmtNum(s.def);
  document.getElementById("statCrit").textContent = s.crit.toFixed(1) + "%";
  document.getElementById("statSpd").textContent = s.spd.toFixed(2);
}

// ---------- Equipment slots ----------
function renderEquipSlots(player, onSlotClick) {
  const container = document.getElementById("equipSlots");
  container.innerHTML = "";
  for (const slot of SLOTS) {
    const item = player.equipment[slot];
    const el = document.createElement("div");
    el.className = "equip-slot" + (item ? " filled" : "");
    if (item) {
      el.style.borderColor = RARITY[item.rarity].color;
      el.style.boxShadow = `0 0 10px ${RARITY[item.rarity].glow}`;
      el.innerHTML = iconHtml(item.icon, RARITY[item.rarity].color);
    } else {
      el.innerHTML = `<span class="equip-slot-label">${SLOT_LABEL[slot]}</span>`;
    }
    el.addEventListener("click", (e) => onSlotClick(slot, item, e));
    if (item) {
      el.addEventListener("mouseenter", (e) => showTooltip(item, e, { equippedSlot: slot }));
      el.addEventListener("mousemove", positionTooltip);
      el.addEventListener("mouseleave", hideTooltip);
    }
    container.appendChild(el);
  }
}

// ---------- Dungeon list ----------
function renderDungeonList(player, onSelect) {
  const container = document.getElementById("dungeonList");
  container.innerHTML = "";
  DUNGEONS.forEach((d, idx) => {
    const locked = idx > player.unlockedDungeonIndex;
    const el = document.createElement("div");
    el.className = "dungeon-card" + (locked ? " locked" : "");
    el.innerHTML = `
      <div class="dungeon-card-info">
        <span class="dungeon-card-name">${d.name}</span>
        <span class="dungeon-card-desc">${d.desc}</span>
        <span class="dungeon-card-level">เลเวลแนะนำ ${d.minLevel}+</span>
      </div>
      <button class="dungeon-card-action" ${locked ? "disabled" : ""}>${locked ? "ปิดอยู่" : "ลุย"}</button>
    `;
    if (!locked) {
      el.addEventListener("click", () => onSelect(idx));
    }
    container.appendChild(el);
  });
}

// ---------- Inventory grid ----------
function renderInventory(player, handlers) {
  const grid = document.getElementById("invGrid");
  document.getElementById("invCount").textContent = `${player.inventory.length}/60`;
  grid.innerHTML = "";
  player.inventory.forEach((item) => {
    const el = document.createElement("div");
    el.className = "inv-slot" + (item.locked ? " locked" : "");
    el.style.borderColor = RARITY[item.rarity].color + "55";
    el.innerHTML = iconHtml(item.icon, RARITY[item.rarity].color);
    el.addEventListener("mouseenter", (e) => showTooltip(item, e, { inventoryItem: true }));
    el.addEventListener("mousemove", positionTooltip);
    el.addEventListener("mouseleave", hideTooltip);
    el.addEventListener("click", () => handlers.onEquip(item));
    grid.appendChild(el);
  });
}

// ---------- Tooltip ----------
let tooltipCtx = null;
function showTooltip(item, evt, ctx) {
  tooltipCtx = { item, ...ctx };
  const tip = document.getElementById("itemTooltip");
  const rarityInfo = RARITY[item.rarity];
  const statsHtml = Object.entries(item.stats).map(([k, v]) =>
    `<div class="tooltip-stat"><span>${statLabel(k)}</span><span>${statValueDisplay(k, v)}</span></div>`
  ).join("");

  let actionsHtml = "";
  if (ctx.inventoryItem) {
    actionsHtml = `<div class="tooltip-actions">
      <button data-act="equip">สวม</button>
      <button data-act="lock">${item.locked ? "ปลดล็อก" : "ล็อก"}</button>
      <button data-act="sell">ขาย ${sellValue(item)}g</button>
    </div>`;
  } else if (ctx.equippedSlot) {
    actionsHtml = `<div class="tooltip-actions"><button data-act="unequip">ถอด</button></div>`;
  }

  tip.innerHTML = `
    <div class="tooltip-name" style="color:${rarityInfo.color}">${item.name}</div>
    <div class="tooltip-rarity" style="color:${rarityInfo.color}">${rarityInfo.label} · Lv.${item.itemLevel}</div>
    ${statsHtml}
    ${actionsHtml}
  `;
  tip.classList.remove("hidden");
  positionTooltip(evt);

  tip.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const act = btn.dataset.act;
      if (window.__tooltipActionHandler) window.__tooltipActionHandler(act, item);
    });
  });
}
function positionTooltip(evt) {
  const tip = document.getElementById("itemTooltip");
  if (tip.classList.contains("hidden")) return;
  const padding = 14;
  let x = evt.clientX + padding;
  let y = evt.clientY + padding;
  const rect = tip.getBoundingClientRect();
  if (x + rect.width > window.innerWidth - 10) x = evt.clientX - rect.width - padding;
  if (y + rect.height > window.innerHeight - 10) y = evt.clientY - rect.height - padding;
  tip.style.left = x + "px";
  tip.style.top = y + "px";
}
function hideTooltip() {
  document.getElementById("itemTooltip").classList.add("hidden");
}

// ---------- Toast ----------
function showToast(message) {
  const container = document.getElementById("toastContainer");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// ---------- Battle stage rendering ----------
function setArenaCombatants(player, monster) {
  const stats = getTotalStats(player);
  document.getElementById("monsterNameLabel").textContent = monster.name;
  updateHpBar("player", player.currentHp, stats.hp);
  updateHpBar("monster", monster.hp, monster.maxHp);
}

function updateHpBar(who, hp, maxHp) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  document.getElementById(who + "HpFill").style.width = pct + "%";
  document.getElementById(who + "HpLabel").textContent = `${fmtNum(Math.max(0,hp))}/${fmtNum(maxHp)}`;
}

function appendCombatLog(text, cls) {
  const log = document.getElementById("combatLog");
  const line = document.createElement("div");
  if (cls) line.className = cls;
  line.textContent = text;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
  while (log.children.length > 40) log.removeChild(log.firstChild);
}

function clearCombatLog() {
  document.getElementById("combatLog").innerHTML = "";
}

// ---------- Combat FX ----------
function playAttackAnim(actor) {
  const playerEl = document.getElementById("arenaPlayer").closest(".combatant");
  const monsterEl = document.getElementById("arenaMonster").closest(".combatant");
  const attacker = actor === "player" ? playerEl : monsterEl;
  const defender = actor === "player" ? monsterEl : playerEl;

  const attackCls = actor === "player" ? "attack-player" : "attack-monster";
  attacker.classList.add(attackCls);
  setTimeout(() => attacker.classList.remove(attackCls), 450);

  setTimeout(() => {
    defender.classList.add("hit-flash", "shake");
    setTimeout(() => defender.classList.remove("hit-flash", "shake"), 320);
    spawnParticles(defender);
  }, 190);
}

function spawnParticles(targetEl) {
  const fxLayer = document.getElementById("fxLayer");
  const arenaRect = fxLayer.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();
  const cx = targetRect.left - arenaRect.left + targetRect.width / 2;
  const cy = targetRect.top - arenaRect.top + targetRect.height / 2.4;

  for (let i = 0; i < 7; i++) {
    const p = document.createElement("div");
    p.className = "fx-particle burst";
    const angle = Math.random() * Math.PI * 2;
    const dist = 24 + Math.random() * 30;
    p.style.setProperty("--dx", Math.cos(angle) * dist + "px");
    p.style.setProperty("--dy", Math.sin(angle) * dist + "px");
    p.style.left = cx + "px";
    p.style.top = cy + "px";
    fxLayer.appendChild(p);
    setTimeout(() => p.remove(), 600);
  }
}

function spawnDamageText(actor, damage, isCrit) {
  const fxLayer = document.getElementById("fxLayer");
  const targetEl = (actor === "player" ? document.getElementById("arenaPlayer") : document.getElementById("arenaMonster")).closest(".combatant");
  const arenaRect = fxLayer.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();
  const cx = targetRect.left - arenaRect.left + targetRect.width / 2;
  const cy = targetRect.top - arenaRect.top + 10;

  const el = document.createElement("div");
  el.className = "fx-damage-text " + (isCrit ? "dmg-crit" : (actor === "player" ? "dmg-player-taken" : "dmg-monster-taken"));
  el.textContent = (isCrit ? "✦ " : "") + damage;
  el.style.left = (cx - 14) + "px";
  el.style.top = cy + "px";
  fxLayer.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => el.remove(), 950);
}
