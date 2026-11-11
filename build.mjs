import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
for(const file of ['apps/web/server.mjs','apps/web/seed.mjs','apps/web/public/app.js','apps/web/public/preview-adapter.js']){
 const r=spawnSync(process.execPath,['--check',join(root,file)],{encoding:'utf8'});
 if(r.status!==0)throw Error(r.stderr);
}
const pub=join(root,'apps/web/public'),out=join(root,'dist');mkdirSync(out,{recursive:true});
let html=readFileSync(join(pub,'index.html'),'utf8');
const css=readFileSync(join(pub,'styles.css'),'utf8');
const js=readFileSync(join(pub,'app.js'),'utf8');
const preview=readFileSync(join(pub,'preview-adapter.js'),'utf8');
const seed=JSON.parse(readFileSync(join(pub,'preview-seed.json'),'utf8'));seed.audit=seed.audit.filter(a=>a.action==='DEMO_CREATED');
const script=x=>x.replace(/<\/script/gi,'<\\/script');
html=html.replace('<link rel="stylesheet" href="/styles.css">',`<style>${css}</style>`)
 .replace('<link rel="icon" href="/favicon.svg" type="image/svg+xml">','')
 .replace('<script src="/app.js" defer></script>',`<script>window.CLINIC_PREVIEW=true;window.CLINIC_SEED=${JSON.stringify(seed).replace(/</g,'\\u003c')};</script>\n<script>${script(preview)}</script>\n<script>${script(js)}</script>`);
writeFileSync(join(out,'Abundance-Clinic-OS-Vista-Previa.html'),html);
console.log('OK · Sintaxis validada. Vista previa autocontenida creada en dist/Abundance-Clinic-OS-Vista-Previa.html');
console.log('No es una compilación Next.js. El servidor local se ejecuta directamente con Node.');
