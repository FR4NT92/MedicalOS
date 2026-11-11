@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node.js. Esta entrega fue probada con Node 22.16.0.
  echo Instala una version compatible y vuelve a abrir este archivo.
  pause
  exit /b 1
)
node -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a<22||(a===22&&b<13)?1:0)"
if errorlevel 1 (
  echo Necesitas Node.js 22.13 o posterior con node:sqlite. Probado en 22.16.0.
  pause
  exit /b 1
)
echo Abundance Clinic OS - Iniciando servidor...
echo Abre tu navegador en: http://localhost:3000
echo Para detener el servidor, presiona Ctrl+C.
node apps/web/server.mjs
pause
