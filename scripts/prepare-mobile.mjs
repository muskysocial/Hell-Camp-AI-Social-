import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webDir = path.join(root, 'www');
const excluded = new Set([
  '.git', '.github', 'node_modules', 'www', 'android', 'ios',
  'scripts', 'package.json', 'package-lock.json', 'capacitor.config.ts',
  'README.md', 'LICENSE'
]);

await rm(webDir, { recursive: true, force: true });
await mkdir(webDir, { recursive: true });

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (excluded.has(entry.name)) continue;
  const source = path.join(root, entry.name);
  const destination = path.join(webDir, entry.name);
  await cp(source, destination, { recursive: true });
}

console.log('Prepared Hell Camp local web assets in www/.');
