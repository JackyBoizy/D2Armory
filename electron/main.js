// electron/main.js
import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manifest SQLite path
const dbPath = path.join(
  __dirname,
  "..",
  "manifest",
  "world_sql_content.sqlite3"
);

let db;
const indexByHash = new Map(); // Minimal listing for UI
const fullItemMap = new Map(); // Full item JSON for quick lookup

// Load manifest and build index
async function loadManifest() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);

      db.all("SELECT json FROM DestinyInventoryItemDefinition", (err, rows) => {
        if (err) return reject(err);

        for (const r of rows) {
          try {
            const item = JSON.parse(r.json);
            const meta = {
              hash: item.hash ?? item.itemHash ?? null,
              name: item.displayProperties?.name ?? "",
              icon: item.displayProperties?.icon ?? "",
              itemType: item.itemType ?? null,
              itemTypeDisplayName: item.itemTypeDisplayName ?? "",
              bucketHash: item.inventory?.bucketTypeHash ?? null,
              tierType: item.inventory?.tierType ?? null,
            };

            if (meta.hash != null) {
              indexByHash.set(meta.hash, meta);
              fullItemMap.set(meta.hash, item);
            }
          } catch {
            // skip malformed JSON
          }
        }

        console.log("Manifest loaded. Total items:", indexByHash.size);
        resolve();
      });
    });
  });
}

// Create Electron window
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  
  win.webContents.openDevTools({ mode: "detach" });

  // Development: load Vite dev server
  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
  }
}

// IPC: fetch weapons or filtered items
ipcMain.handle("get-weapons", (event, opts = {}) => {
  const limit = opts.limit ?? 200;
  const offset = opts.offset ?? 0;
  const q = (opts.q || "").toLowerCase();
  const itemTypeFilter = opts.itemType ?? 3; // default weapons

  const filtered = Array.from(indexByHash.values()).filter((item) => {
    if (itemTypeFilter != null && item.itemType !== itemTypeFilter)
      return false;
    if (q && !item.name.toLowerCase().includes(q)) return false;
    return true;
  });

  return {
    total: filtered.length,
    items: filtered.slice(offset, offset + limit),
  };
});

// IPC: fetch full item details
ipcMain.handle("get-item", (event, hash) => fullItemMap.get(hash) || null);

// App lifecycle
app.whenReady().then(async () => {
  try {
    await loadManifest();
  } catch (err) {
    console.error("Failed to load manifest:", err);
  }
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
