@ECHO OFF

ECHO Starting side proxy server...
start "" /min cmd /k "node proxy.js"
ECHO Proxy server started.

ECHO Starting server...
start "" /min cmd /k "npx serve . -c serve.json"

ECHO Waiting for server to start...
:waitLoop
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 1; exit 0 } catch { exit 1 }"
IF ERRORLEVEL 1 (
    timeout /t 1 /nobreak >nul
    GOTO waitLoop
)

start "" "http://localhost:3001"
start "" "http://localhost:3000"
ECHO Server has been started.