@echo off
setlocal

set PORT=8550
set ROOT_DIR=%~dp0

echo Starting Diet Sprite 4.1 on http://localhost:%PORT% ...
cd /d "%ROOT_DIR%"

python -m http.server %PORT%

endlocal