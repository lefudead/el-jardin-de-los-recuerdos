@echo off
title El Jardin de los Recuerdos
cd /d "%~dp0"

rem --- Comprobar permisos de administrador (necesario para el puerto 80) ---
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Solicitando permisos de administrador para abrir el servidor...
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

echo ==========================================
echo   El Jardin de los Recuerdos
echo   Abre: http://jardin.local
echo ==========================================
echo.

rem Abre el navegador una vez el servidor este listo
start "" /b cmd /c "timeout /t 3 /nobreak >nul & start http://jardin.local"

node static.cjs
pause
