# VOIDFALL

เกม idle dungeon crawler สไตล์มินิมอล เล่นบนเว็บเบราว์เซอร์ ไม่ต้องติดตั้งอะไรเพิ่ม

## เล่นเกม

เปิดไฟล์ `index.html` ในเบราว์เซอร์ได้เลย หรือดูเวอร์ชันที่ deploy แล้วผ่าน GitHub Pages

## ฟีเจอร์

- **Auto-battle**: กดเข้าดันเจี้ยนแล้วตัวละครต่อสู้อัตโนมัติทุกห้องจนถึงบอส
- **8 ดันเจี้ยน** ความยากเพิ่มขึ้นเรื่อยๆ ปลดล็อกตามลำดับ
- **ระบบไอเทม 5 ระดับความหายาก**: Common, Uncommon, Rare, Epic, Legendary
- **6 ช่องสวมใส่**: อาวุธ, หัว, ตัว, มือ, เท้า, เครื่องประดับ
- **ระบบเลเวล/EXP**, ทองคำ, ขายไอเทม, ล็อกไอเทมกันขายผิด
- **Offline progress**: ได้ทองคำสะสมแม้ไม่ได้เล่น (จำกัดไม่เกิน 4 ชม.)
- บันทึกอัตโนมัติด้วย `localStorage` — เล่นต่อจากที่ค้างไว้ได้

## วิธี Deploy บน GitHub Pages

1. สร้าง repository ใหม่บน GitHub (หรือใช้ repo เดิม)
2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ขึ้น repo (รักษาโครงสร้างโฟลเดอร์ `css/`, `js/` ไว้เหมือนเดิม)
3. ไปที่ **Settings → Pages**
4. เลือก **Source: Deploy from a branch** → branch `main` → folder `/ (root)`
5. กด **Save** รอ 1-2 นาที จะได้ลิงก์ `https://<username>.github.io/<repo-name>/`

ไม่ต้องตั้งค่า build process หรือ dependency ใดๆ เพราะเป็น static site (HTML/CSS/JS ล้วน) ทำงานได้ทันทีบน GitHub Pages

## โครงสร้างไฟล์

```
voidfall/
├── index.html          หน้าเกมหลัก
├── css/
│   └── style.css       ดีไซน์ทั้งหมด
└── js/
    ├── data.js          ข้อมูลดันเจี้ยน, ไอเทม, rarity
    ├── items.js         ระบบสุ่มไอเทม/ดรอป
    ├── player.js         state ผู้เล่น, การคำนวณ stat, save/load
    ├── combat.js        ระบบต่อสู้
    ├── ui.js            ฟังก์ชัน render UI
    └── main.js          ตัวเชื่อมเกม / game loop
```

## ปรับแต่งเกม

- เพิ่ม/แก้ดันเจี้ยนได้ที่ `js/data.js` ในตัวแปร `DUNGEONS`
- แก้ความหายากและสีของ rarity ได้ที่ตัวแปร `RARITY`
- แก้สมการ stat การเติบโตของผู้เล่นได้ที่ `js/player.js` (`LEVEL_GROWTH`)
