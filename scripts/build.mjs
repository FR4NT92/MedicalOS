import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = existsSync(join(here, '../apps/web/server.mjs'))
  ? join(here, '..')
  : (existsSync(join(here, 'server.mjs')) ? join(here, '../..') : process.cwd());

const webRoot = existsSync(join(root, 'apps/web')) ? join(root, 'apps/web') : root;

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
  for (const f of ['app.js', 'styles.css', 'favicon.svg', 'favicon.png', 'logo.png', 'index.html']) {
    const src = join(pub, f);
    if (existsSync(src)) writeFileSync(join(out, f), readFileSync(src));
  }
}

if (existsSync(join(pub, 'index.html')) && existsSync(join(pub, 'preview-adapter.js')) && existsSync(join(pub, 'preview-seed.json'))) {
  try {
    let html = readFileSync(join(pub, 'index.html'), 'utf8');
    const css = existsSync(join(pub, 'styles.css')) ? readFileSync(join(pub, 'styles.css'), 'utf8') : '';
    const js = existsSync(join(pub, 'app.js')) ? readFileSync(join(pub, 'app.js'), 'utf8') : '';
    const preview = readFileSync(join(pub, 'preview-adapter.js'), 'utf8');
    const seed = JSON.parse(readFileSync(join(pub, 'preview-seed.json'), 'utf8'));
    if (Array.isArray(seed.audit)) seed.audit = seed.audit.filter(a => a.action === 'DEMO_CREATED');
    const script = x => x.replace(/<\/script/gi, '<\\/script');
    html = html.replace('<link rel="stylesheet" href="/styles.css">', `<style>${css}</style>`)
      .replace('<link rel="icon" href="/favicon.svg" type="image/svg+xml">', '')
      .replace('<script src="/app.js" defer></script>', `<script>window.CLINIC_PREVIEW=true;window.CLINIC_SEED=${JSON.stringify(seed).replace(/</g, '\\u003c')};</script>\n<script>${script(preview)}</script>\n<script>${script(js)}</script>`);
    writeFileSync(join(out, 'Abundance-Clinic-OS-Vista-Previa.html'), html);
  } catch (err) {
    console.warn('[preview bundle warning]', err.message);
  }
}

console.log('✓ Build completado con éxito. Archivos estáticos generados en dist/.');
