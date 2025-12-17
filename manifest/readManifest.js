import fs from "fs";
import sqlite3 from "sqlite3";

const DB_PATH = "./world_sql_content.sqlite3";

console.log("Opening DB at:", new URL(DB_PATH, import.meta.url).pathname);

console.log("File exists:", fs.existsSync(DB_PATH));
console.log("File size:", fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH).size : "N/A");

const db = new sqlite3.Database(DB_PATH);

db.all(
  "SELECT name FROM sqlite_master WHERE type='table'",
  (err, rows) => {
    if (err) {
      console.error("SQLite error:", err);
      return;
    }

    console.log("Tables found:", rows.length);
    rows.forEach(r => console.log(r.name));
  }
);
