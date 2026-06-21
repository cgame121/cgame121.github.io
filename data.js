// ============================================
// VOIDFALL - Game Data
// ============================================

const RARITY = {
  common:    { label: "Common",    color: "#9CA3AF", glow: "rgba(156,163,175,0.45)", weight: 100, mult: 1.0 },
  uncommon:  { label: "Uncommon",  color: "#3DDC97", glow: "rgba(61,220,151,0.5)",    weight: 55,  mult: 1.35 },
  rare:      { label: "Rare",      color: "#5B9CFF", glow: "rgba(91,156,255,0.55)",   weight: 25,  mult: 1.85 },
  epic:      { label: "Epic",      color: "#B07CFC", glow: "rgba(176,124,252,0.6)",   weight: 9,   mult: 2.6 },
  legendary: { label: "Legendary", color: "#F6C453", glow: "rgba(246,196,83,0.75)",   weight: 2,   mult: 3.8 },
};

const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"];

// Slot definitions
const SLOTS = ["weapon", "head", "body", "hands", "feet", "trinket"];
const SLOT_LABEL = {
  weapon: "อาวุธ", head: "หัว", body: "ตัว", hands: "มือ", feet: "เท้า", trinket: "เครื่องประดับ",
};

// Base item templates per slot (stat ranges scale with rarity mult + item level)
const ITEM_TEMPLATES = {
  weapon: [
    { name: "มีดสั้นเงา", primary: "atk", icon: "blade" },
    { name: "ดาบหักแสง", primary: "atk", icon: "blade" },
    { name: "คทาวิญญาณ", primary: "atk", icon: "staff" },
  ],
  head: [
    { name: "หมวกคลุมราตรี", primary: "def", icon: "helm" },
    { name: "มงกุฎเถ้าถ่าน", primary: "hp", icon: "helm" },
  ],
  body: [
    { name: "เกราะเศษดาว", primary: "def", icon: "armor" },
    { name: "เสื้อคลุมหมอกควัน", primary: "hp", icon: "armor" },
  ],
  hands: [
    { name: "ปลอกมือกระดูก", primary: "crit", icon: "gloves" },
    { name: "ถุงมือนักล่า", primary: "atk", icon: "gloves" },
  ],
  feet: [
    { name: "รองเท้าสายลม", primary: "spd", icon: "boots" },
    { name: "บูทเงาราตรี", primary: "def", icon: "boots" },
  ],
  trinket: [
    { name: "หินวิญญาณ", primary: "crit", icon: "gem" },
    { name: "เศษแก้วต้องสาป", primary: "atk", icon: "gem" },
  ],
};

// Dungeons - 8 total, each with 4 normal rooms + 1 boss room
const DUNGEONS = [
  {
    id: "d1", name: "ป่าเถ้าจาง", minLevel: 1,
    desc: "ป่าที่แสงแดดไม่เคยลอดผ่าน เถ้าฝุ่นลอยอยู่กลางอากาศตลอดเวลา",
    monsterPool: ["หนูเงา", "ค้างคาวมืด", "หมาป่าซีด"],
    boss: { name: "ราชาหมาป่าเถ้า", hpMult: 4.5 },
    baseHp: 18, baseAtk: 4, baseDef: 1, goldMult: 1, expMult: 1,
    dropTable: { common: 70, uncommon: 25, rare: 5, epic: 0, legendary: 0 },
  },
  {
    id: "d2", name: "สุสานเสียงครวญ", minLevel: 4,
    desc: "หลุมศพเก่าที่ไม่มีใครจดจำชื่อผู้ตาย เสียงครวญลอยมาตามลม",
    monsterPool: ["โครงกระดูกพเนจร", "ผีดิบไร้เสียง", "วิญญาณคร่ำครวญ"],
    boss: { name: "เจ้าสุสานไร้นาม", hpMult: 5 },
    baseHp: 32, baseAtk: 7, baseDef: 3, goldMult: 1.4, expMult: 1.3,
    dropTable: { common: 55, uncommon: 32, rare: 11, epic: 2, legendary: 0 },
  },
  {
    id: "d3", name: "เหมืองคริสตัลร้าง", minLevel: 8,
    desc: "เหมืองที่ขุดลึกเกินไปจนปลุกสิ่งที่หลับใหลขึ้นมา",
    monsterPool: ["โกเลมคริสตัล", "ค้างคาวพิษ", "แมงมุมเหมือง"],
    boss: { name: "ผู้พิทักษ์คริสตัล", hpMult: 5.5 },
    baseHp: 55, baseAtk: 11, baseDef: 6, goldMult: 1.9, expMult: 1.6,
    dropTable: { common: 45, uncommon: 35, rare: 16, epic: 4, legendary: 0 },
  },
  {
    id: "d4", name: "หอคอยกระจกแตก", minLevel: 13,
    desc: "หอคอยที่กระจกทุกบานสะท้อนภาพไม่ตรงกับความจริง",
    monsterPool: ["เงาสะท้อนวิปลาส", "อัศวินกระจก", "ภูตแสงหัก"],
    boss: { name: "จอมเวทกระจกมืด", hpMult: 6 },
    baseHp: 88, baseAtk: 17, baseDef: 10, goldMult: 2.5, expMult: 2.1,
    dropTable: { common: 35, uncommon: 38, rare: 20, epic: 6, legendary: 1 },
  },
  {
    id: "d5", name: "ทะเลทรายเลือดแห้ง", minLevel: 19,
    desc: "ทรายสีแดงคล้ำที่จดจำสงครามครั้งใหญ่ในอดีต",
    monsterPool: ["นักรบทรายผุ", "อสรพิษเพลิง", "หัวขโมยทะเลทราย"],
    boss: { name: "จอมทัพทรายเดือด", hpMult: 6.5 },
    baseHp: 130, baseAtk: 25, baseDef: 15, goldMult: 3.2, expMult: 2.7,
    dropTable: { common: 28, uncommon: 38, rare: 24, epic: 9, legendary: 1 },
  },
  {
    id: "d6", name: "วิหารใต้นทีดำ", minLevel: 26,
    desc: "วิหารจมอยู่ใต้แม่น้ำที่ไม่มีแสงใดส่องถึง",
    monsterPool: ["นักบวชจมน้ำ", "งูทะเลลึก", "เทพปลอมแปลง"],
    boss: { name: "เทพเจ้าผิดเพี้ยน", hpMult: 7 },
    baseHp: 195, baseAtk: 36, baseDef: 22, goldMult: 4.1, expMult: 3.4,
    dropTable: { common: 20, uncommon: 36, rare: 28, epic: 14, legendary: 2 },
  },
  {
    id: "d7", name: "ป้อมปราการเหล็กกล้า", minLevel: 34,
    desc: "ป้อมที่ครั้งหนึ่งปกป้องอาณาจักร บัดนี้กลับหันมาทำลายผู้บุกรุก",
    monsterPool: ["ทหารเหล็กพัง", "ปืนใหญ่วิญญาณ", "แม่ทัพไร้หัว"],
    boss: { name: "จักรกลสงครามต้องสาป", hpMult: 7.5 },
    baseHp: 280, baseAtk: 50, baseDef: 32, goldMult: 5.3, expMult: 4.3,
    dropTable: { common: 14, uncommon: 32, rare: 30, epic: 20, legendary: 4 },
  },
  {
    id: "d8", name: "ห้วงดิ่งสุดท้าย", minLevel: 43,
    desc: "จุดสิ้นสุดของดันเจี้ยนทั้งมวล ที่ความมืดไม่มีก้นบึ้ง",
    monsterPool: ["เศษเสี้ยวความมืด", "ผู้เฝ้าห้วง", "วิญญาณพลัดถิ่น"],
    boss: { name: "ผู้ครองห้วงดิ่ง", hpMult: 8.5 },
    baseHp: 420, baseAtk: 70, baseDef: 45, goldMult: 7, expMult: 5.8,
    dropTable: { common: 8, uncommon: 24, rare: 32, epic: 28, legendary: 8 },
  },
];

// Player base stats at level 1
const PLAYER_BASE = {
  hp: 50, atk: 8, def: 3, crit: 5, spd: 1.0,
};

// Stat growth per level
const LEVEL_GROWTH = {
  hp: 8, atk: 1.6, def: 0.7, crit: 0.15,
};

// EXP needed for next level: formula based
function expForLevel(level) {
  return Math.floor(25 * Math.pow(level, 1.55));
}
