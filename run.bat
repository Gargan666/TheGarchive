@ECHO OFF

ECHO Updating entry list...
node javascript/build-index.js

ECHO Starting server...
start "The Garchive - Static Server" /min cmd /k "npx serve . -c serve.json"

ECHO Waiting for server to start...
:waitLoop
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 1; exit 0 } catch { exit 1 }"
IF ERRORLEVEL 1 (
    timeout /t 1 /nobreak >nul
    GOTO waitLoop
)

start "" "http://localhost:3000"
ECHO Server has been started.