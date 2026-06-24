// voidfall-worker.js
// Web Worker ทำหน้าที่เป็น timer แทน setInterval
// รันได้แม้ tab ถูก throttle หรือย่อจอ
let timers = {};
let nextId = 1;

self.onmessage = function(e) {
  const { type, id, ms } = e.data;

  if (type === "setInterval") {
    const tid = nextId++;
    timers[tid] = setInterval(() => {
      self.postMessage({ type: "tick", id: tid });
    }, ms);
    self.postMessage({ type: "created", clientId: id, workerId: tid });
  }

  if (type === "clearInterval") {
    if (timers[id]) {
      clearInterval(timers[id]);
      delete timers[id];
    }
  }
};
