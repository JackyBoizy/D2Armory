// electron/preload.js
import { contextBridge, ipcRenderer } from "electron";

console.log("✅ PRELOAD LOADED");

contextBridge.exposeInMainWorld("api", {
  // Async
  getWeapons: (opts) => ipcRenderer.invoke("get-weapons", opts),
  getItem: (hash) => ipcRenderer.invoke("get-item", hash),

  // Sync (perks / buckets)
  getItemSync: (hash) => ipcRenderer.sendSync("get-item-sync", hash),
});
