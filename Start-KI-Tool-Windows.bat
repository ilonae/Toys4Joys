@echo off
REM ============================================================
REM  KI-Produkt-Tool - Start (Windows)
REM  Double-click this file to launch the tool.
REM ============================================================

cd /d "%~dp0"

echo --------------------------------------------------
echo   KI-Produkt-Tool wird gestartet...
echo --------------------------------------------------

REM 1. Check for Python
where python >nul 2>nul
if errorlevel 1 (
  echo.
  echo   [!] Python ist nicht installiert.
  echo       Bitte hier installieren ^(Haken bei "Add to PATH" setzen^):
  echo         https://www.python.org/downloads/
  echo       Danach diese Datei erneut doppelklicken.
  echo.
  pause
  exit /b 1
)

REM 2. First-run setup: venv + dependencies
if not exist "venv\" (
  echo   Erstinstallation laeuft ^(einmalig, ca. 2-3 Min^)...
  python -m venv venv
  venv\Scripts\python -m pip install --quiet --upgrade pip
  echo   Lade Hintergrund-Entfernung ^(rembg^)...
  venv\Scripts\pip install --quiet -r requirements.txt
  echo   Installation abgeschlossen.
)

REM 3. Start the rembg server in a new window
echo   Starte Freisteller-Server...
start "rembg-Server" venv\Scripts\python remove_bg_server.py

REM 4. Give the server a moment, then open the tool
timeout /t 6 /nobreak >nul
echo   Tool wird geoeffnet...
start "" ".superdesign\design_iterations\ki_produkt_tool_1_1.html"

echo.
echo --------------------------------------------------
echo   Fertig. Das Tool laeuft im Browser.
echo   WICHTIG: Das "rembg-Server"-Fenster geoeffnet
echo   lassen, solange du das Tool benutzt.
echo --------------------------------------------------
pause
