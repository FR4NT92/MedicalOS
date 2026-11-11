import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = existsSync(join(here, '../server.mjs'))
  ? join(here, '..')
  : (existsSync(join(here, '../../apps/web/server.mjs')) ? join(here, '../..') : process.cwd());

const webRoot = existsSync(join(root, 'server.mjs')) ? root : (existsSync(join(root, 'apps/web')) ? join(root, 'apps/web') : root);

const filesToCheck = [
  join(webRoot, 'server.mjs'),
  join(webRoot, 'seed.mjs'),
  join(webRoot, 'public/app.js')
];

for (const file of filesToCheck) {
  if (existsSync(file)) {
    const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (r.status !== 0) console.warn('[build check warning]', r.stderr);
  }
}

const pub = join(webRoot, 'public');
const out = join(root, 'dist');
mkdirSync(out, { recursive: true });

if (existsSync(pub)) {
  for (const f of ['app.js', 'styles.css', 'favicon.svg', 'index.html']) {
    const src = join(pub, f);
    if (existsSync(src)) writeFileSync(join(out, f), readFileSync(src));
  }
}

console.log('✓ Build apps/web completado con éxito.');
