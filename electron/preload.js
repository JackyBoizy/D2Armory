// electron/preload.js
import { contextBridge, ipcRenderer } from "electron";

console.log("✅ PRELOAD LOADED");

contextBridge.exposeInMainWorld("api", {
  // Async item & weapon retrieval
  getWeapons: (opts) => ipcRenderer.invoke("get-weapons", opts),
  getItem: (hash) => ipcRenderer.invoke("get-item", hash),

  // Sync item retrieval for quick lookups
  getItemSync: (hash) => ipcRenderer.sendSync("get-item-sync", hash),

  // New: plug set retrieval (returns the entire DestinyPlugSetDefinition)
  getPlugSet: (plugSetHash) => ipcRenderer.invoke("get-plugset", plugSetHash),
});
