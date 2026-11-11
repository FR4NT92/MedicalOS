#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo 'No se encontró Node.js. Esta entrega fue probada con Node 22.16.0.'
  exit 1
fi
node -e 'const [a,b]=process.versions.node.split(".").map(Number); if(a<22||(a===22&&b<13)){console.error("Se requiere Node >=22.13 con node:sqlite; probado en 22.16.");process.exit(1)}'
echo 'Abundance Clinic OS · Iniciando plataforma...'
echo 'Abre tu navegador en: http://localhost:3000'
exec node apps/web/server.mjs
