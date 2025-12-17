import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./world_sql_content.sqlite3");

// Get all items, limit for testing
db.all(
  "SELECT json FROM DestinyInventoryItemDefinition LIMIT 1000",
  (err, rows) => {
    if (err) throw err;

    // Parse JSON and filter weapons in JS
    const weapons = rows
      .map(r => JSON.parse(r.json))
      .filter(item => item.itemType === 3); // 3 = Weapon

    // Print first 20 weapons
    weapons.slice(0, 20).forEach(item => {
      console.log(item.displayProperties.name, "-", item.itemTypeDisplayName);
    });

    console.log(`Total weapons found in first 1000 items: ${weapons.length}`);
  }
);
