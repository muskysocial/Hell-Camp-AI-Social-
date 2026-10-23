import { cp, mkdir } from "node:fs/promises";

await mkdir("www", { recursive: true });
for (const file of ["index.html", "manifest.json", "sw.js"]) {
  await cp(file, `www/${file}`);
}
await cp("icons", "www/icons", { recursive: true });
console.log("Prepared Hell Camp web assets in www/.");
