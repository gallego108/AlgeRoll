@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

set "PORT=4173"
set "PIDFILE=%~dp0.algeroll-server.pid"
set "LOGFILE=%~dp0algeroll-server.log"
set "ERRFILE=%~dp0algeroll-server-error.log"

REM ============================================================
REM AlgeRoll - iniciador / detenedor de un solo clic
REM - Primer doble clic: inicia el servidor y abre el navegador.
REM - Segundo doble clic: detiene el mismo servidor.
REM ============================================================

if exist "%PIDFILE%" (
    set /p SERVER_PID=<"%PIDFILE%"
    if defined SERVER_PID (
        powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = Get-Process -Id !SERVER_PID! -ErrorAction SilentlyContinue; if ($p) { Stop-Process -Id !SERVER_PID! -Force; exit 0 } else { exit 2 }" >nul 2>&1
        if !errorlevel! EQU 0 (
            del /q "%PIDFILE%" >nul 2>&1
            echo.
            echo AlgeRoll se ha detenido correctamente.
            echo Puedes cerrar esta ventana.
            timeout /t 2 /nobreak >nul
            exit /b 0
        )
    )
    del /q "%PIDFILE%" >nul 2>&1
)

where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: No se encontro Node.js en este equipo.
    echo.
    echo Instala Node.js LTS y vuelve a ejecutar este archivo.
    echo No es necesario ejecutar npm install: el prototipo no tiene dependencias externas.
    echo.
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$root = (Resolve-Path '.').Path;" ^
  "$out = Join-Path $root 'algeroll-server.log';" ^
  "$err = Join-Path $root 'algeroll-server-error.log';" ^
  "$p = Start-Process -FilePath 'node' -ArgumentList @('server.mjs','--port','%PORT%') -WorkingDirectory $root -PassThru -WindowStyle Hidden -RedirectStandardOutput $out -RedirectStandardError $err;" ^
  "Set-Content -Path (Join-Path $root '.algeroll-server.pid') -Value $p.Id"

if errorlevel 1 (
    echo.
    echo ERROR: No se pudo iniciar el servicio de AlgeRoll.
    echo Revisa algeroll-server-error.log para mas detalles.
    echo.
    pause
    exit /b 1
)

timeout /t 1 /nobreak >nul

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:%PORT%/' -TimeoutSec 2; if ($r.StatusCode -ne 200) { exit 1 } } catch { exit 1 }" >nul 2>&1

if errorlevel 1 (
    echo.
    echo ERROR: El proceso se inicio, pero la pagina no responde en el puerto %PORT%.
    echo Revisa algeroll-server-error.log.
    if exist "%PIDFILE%" (
        set /p SERVER_PID=<"%PIDFILE%"
        powershell -NoProfile -ExecutionPolicy Bypass -Command "Stop-Process -Id !SERVER_PID! -Force -ErrorAction SilentlyContinue" >nul 2>&1
        del /q "%PIDFILE%" >nul 2>&1
    )
    pause
    exit /b 1
)

start "" "http://127.0.0.1:%PORT%/"

echo.
echo ============================================================
echo AlgeRoll esta ejecutandose en:
echo http://127.0.0.1:%PORT%/
echo.
echo Para CERRAR el servicio, vuelve a hacer doble clic en:
echo AlgeRoll.bat
echo ============================================================
echo.
timeout /t 4 /nobreak >nul
exit /b 0
