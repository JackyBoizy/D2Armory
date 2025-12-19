// electron/main.js
import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to manifest SQLite
const dbPath = path.join(__dirname, "..", "manifest", "world_sql_content.sqlite3");

let db;
const indexByHash = new Map();
const fullItemMap = new Map();

async function loadManifest() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
      db.all("SELECT json FROM DestinyInventoryItemDefinition", (err, rows) => {
        if (err) return reject(err);
        for (const r of rows) {
          try {
            const item = JSON.parse(r.json);
            const hash = item.hash ?? item.itemHash;
            if (!hash) continue;
            indexByHash.set(hash, {
              hash,
              name: item.displayProperties?.name ?? "",
              icon: item.displayProperties?.icon ?? "",
              itemType: item.itemType ?? null,
              itemTypeDisplayName: item.itemTypeDisplayName ?? "",
              bucketHash: item.inventory?.bucketTypeHash ?? null,
            });
            fullItemMap.set(hash, item);
          } catch {
            // skip malformed
          }
        }
        console.log("✅ Manifest loaded:", indexByHash.size, "items");
        resolve();
      });
    });
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  win.webContents.openDevTools({ mode: "detach" });
  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
  }
}

// IPC handlers
ipcMain.handle("get-weapons", (_event, opts = {}) => {
  const limit = opts.limit ?? 200;
  const offset = opts.offset ?? 0;
  const q = (opts.q || "").toLowerCase();
  const itemType = opts.itemType ?? 3;
  const filtered = Array.from(indexByHash.values()).filter((item) => {
    if (item.itemType !== itemType) return false;
    if (q && !item.name.toLowerCase().includes(q)) return false;
    return true;
  });
  return { total: filtered.length, items: filtered.slice(offset, offset + limit) };
});

ipcMain.handle("get-item", (_event, hash) => {
  return fullItemMap.get(hash) || null;
});

ipcMain.on("get-item-sync", (event, hash) => {
  event.returnValue = fullItemMap.get(hash) || null;
});

// Correct plug-set query: use "id" column
ipcMain.handle("get-plugset", (_event, plugSetHash) => {
  return new Promise((resolve) => {
    db.get(
      "SELECT json FROM DestinyPlugSetDefinition WHERE id = ?",
      plugSetHash,
      (err, row) => {
        if (err || !row) {
          resolve(null);
        } else {
          try {
            resolve(JSON.parse(row.json));
          } catch {
            resolve(null);
          }
        }
      }
    );
  });
});

ipcMain.handle("get-socket-type", (_event, hash) => {
  return new Promise((resolve) => {
    db.get(
      "SELECT json FROM DestinySocketTypeDefinition WHERE hash = ?",
      hash,
      (err, row) => {
        if (err || !row) return resolve(null);
        try {
          resolve(JSON.parse(row.json));
        } catch {
          resolve(null);
        }
      }
    );
  });
});

app.whenReady().then(async () => {
  try {
    await loadManifest();
    createWindow();
  } catch (err) {
    console.error("❌ Manifest load failed:", err);
  }
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
