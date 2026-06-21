// ============================================
// VOIDFALL - Combat Engine
// ============================================

const ROOMS_PER_DUNGEON = 5; // 4 normal + 1 boss

function generateMonster(dungeon, roomIndex, player) {
  const isBoss = roomIndex === ROOMS_PER_DUNGEON - 1;
  const scale = 1 + roomIndex * 0.18;
  const name = isBoss
    ? dungeon.boss.name
    : dungeon.monsterPool[Math.floor(Math.random() * dungeon.monsterPool.length)];

  const hpMult = isBoss ? dungeon.boss.hpMult : 1;

  return {
    name,
    isBoss,
    maxHp: Math.round(dungeon.baseHp * scale * hpMult),
    hp: Math.round(dungeon.baseHp * scale * hpMult),
    atk: Math.round(dungeon.baseAtk * scale * (isBoss ? 1.4 : 1)),
    def: Math.round(dungeon.baseDef * scale * (isBoss ? 1.3 : 1)),
    spd: 0.85 + Math.random() * 0.3,
  };
}

// Combat is resolved as a sequence of discrete "ticks" the UI can animate through.
// Each tick = one attack from either side, determined by relative speed using an
// accumulator model so higher SPD attacks more often.
function simulateBattle(player, monster) {
  const stats = getTotalStats(player);
  const playerState = { hp: player.currentHp != null ? player.currentHp : stats.hp, maxHp: stats.hp, spdAcc: 0 };
  const monsterState = { hp: monster.hp, maxHp: monster.maxHp, spdAcc: 0 };

  const log = [];
  let tickGuard = 0;

  while (playerState.hp > 0 && monsterState.hp > 0 && tickGuard < 500) {
    tickGuard++;
    playerState.spdAcc += stats.spd;
    monsterState.spdAcc += monster.spd;

    // whoever crosses threshold first acts; loop until someone does, allow both in same pass
    if (playerState.spdAcc >= 1) {
      playerState.spdAcc -= 1;
      const result = resolveAttack(stats.atk, monster.def, stats.crit);
      monsterState.hp = Math.max(0, monsterState.hp - result.damage);
      log.push({ actor: "player", ...result, targetHpAfter: monsterState.hp, targetMaxHp: monsterState.maxHp });
      if (monsterState.hp <= 0) break;
    }
    if (monsterState.spdAcc >= 1) {
      monsterState.spdAcc -= 1;
      const result = resolveAttack(monster.atk, stats.def, 5);
      playerState.hp = Math.max(0, playerState.hp - result.damage);
      log.push({ actor: "monster", ...result, targetHpAfter: playerState.hp, targetMaxHp: playerState.maxHp });
      if (playerState.hp <= 0) break;
    }
  }

  return {
    log,
    playerWon: monsterState.hp <= 0 && playerState.hp > 0,
    playerFinalHp: playerState.hp,
    playerMaxHp: playerState.maxHp,
  };
}

function resolveAttack(atk, def, critChance) {
  const mitigated = Math.max(1, Math.round(atk - def * 0.5));
  const variance = 0.85 + Math.random() * 0.3;
  let damage = Math.round(mitigated * variance);
  const isCrit = Math.random() * 100 < critChance;
  if (isCrit) damage = Math.round(damage * 1.75);
  return { damage, isCrit };
}

function rollLoot(dungeon) {
  // 65% chance of an item drop per kill, 100% for boss
  return generateItem(dungeon, dungeon.dropTable);
}

function goldDropForKill(dungeon, isBoss) {
  const base = 4 + dungeon.minLevel * 1.4;
  return Math.round(base * dungeon.goldMult * (isBoss ? 4.5 : 1) * (0.85 + Math.random() * 0.3));
}

function expDropForKill(dungeon, isBoss) {
  const base = 6 + dungeon.minLevel * 1.8;
  return Math.round(base * dungeon.expMult * (isBoss ? 4 : 1) * (0.85 + Math.random() * 0.3));
}
