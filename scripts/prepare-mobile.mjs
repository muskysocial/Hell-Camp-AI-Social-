import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webDir = path.join(root, 'www');

// Bundle only the website's runtime files. Never copy repository metadata,
// backend source, environment files, build credentials, or development tooling
// into the app's publicly readable WebView asset directory.
const allowedRootFiles = new Set([
  'index.html',
  'manifest.json',
  'design-tokens.css',
  'hell-visual-runtime.js',
  'hellcamp-ai-lab.js',
  'hellcamp-member-ai.js',
  'sproute-admin.js'
]);
const allowedAssetDirectories = new Set([
  'icons',
  'assets',
  'images',
  'fonts',
  'public'
]);

await rm(webDir, { recursive: true, force: true });
await mkdir(webDir, { recursive: true });

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isFile() && allowedRootFiles.has(entry.name)) {
    await cp(path.join(root, entry.name), path.join(webDir, entry.name));
    continue;
  }

  if (entry.isDirectory() && allowedAssetDirectories.has(entry.name)) {
    await cp(path.join(root, entry.name), path.join(webDir, entry.name), {
      recursive: true
    });
  }
}

console.log('Prepared allowlisted Hell Camp website runtime files in www/.');
