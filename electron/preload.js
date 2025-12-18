
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  getWeapons: (opts) => ipcRenderer.invoke('get-weapons', opts),
  getItem: (hash) => ipcRenderer.invoke('get-item', hash),
});
