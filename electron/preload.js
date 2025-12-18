const { contextBridge, ipcRenderer } = require("electron");

console.log("✅ PRELOAD FILE EXECUTED");

contextBridge.exposeInMainWorld("api", {
  getWeapons: (opts) => ipcRenderer.invoke("get-weapons", opts),
  getItem: (hash) => ipcRenderer.invoke("get-item", hash),
});
