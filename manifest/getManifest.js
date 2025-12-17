import fs from "fs";

const res = await fetch("https://www.bungie.net/Platform/Destiny2/Manifest/");
const data = await res.json();

const path = data.Response.mobileWorldContentPaths.en;
const url = "https://www.bungie.net" + path;

const file = await fetch(url);
const buffer = await file.arrayBuffer();

fs.writeFileSync(
  "./world_sql_content.zip",
  Buffer.from(buffer)
);

console.log("Manifest downloaded");
