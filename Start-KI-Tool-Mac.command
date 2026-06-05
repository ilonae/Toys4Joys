#!/bin/bash
# ============================================================
#  KI-Produkt-Tool — Start (macOS)
#  Double-click this file to launch the tool.
#  It sets up the background-removal server (first run only),
#  starts it, and opens the tool in your browser.
# ============================================================

cd "$(dirname "$0")" || exit 1

echo "──────────────────────────────────────────────"
echo "  KI-Produkt-Tool wird gestartet…"
echo "──────────────────────────────────────────────"

# 1. Check for Python 3
if ! command -v python3 >/dev/null 2>&1; then
  echo ""
  echo "  ⚠  Python 3 ist nicht installiert."
  echo "     Bitte hier herunterladen und installieren:"
  echo "       https://www.python.org/downloads/"
  echo "     Danach diese Datei erneut doppelklicken."
  echo ""
  read -r -p "  Mit Enter beenden…" _
  exit 1
fi

# 2. First-run setup: create venv + install dependencies
if [ ! -d "venv" ]; then
  echo "  Erstinstallation läuft (einmalig, ca. 2–3 Min)…"
  python3 -m venv venv || { echo "  ✗ venv konnte nicht erstellt werden"; read -r _; exit 1; }
  ./venv/bin/pip install --quiet --upgrade pip
  echo "  Lade Hintergrund-Entfernung (rembg)…"
  ./venv/bin/pip install --quiet -r requirements.txt || { echo "  ✗ Installation fehlgeschlagen"; read -r _; exit 1; }
  echo "  ✓ Installation abgeschlossen."
fi

# 3. Start the rembg server (downloads the AI model on first run, ~350 MB)
echo "  Starte Freisteller-Server…"
./venv/bin/python remove_bg_server.py &
SERVER_PID=$!

# 4. Wait for the server to answer, then open the tool
echo "  Warte auf den Server…"
for i in $(seq 1 60); do
  if curl -s -m 2 -X POST http://localhost:5001/remove-bg \
       -H "Content-Type: application/json" -d '{"ping":true}' >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "  ✓ Server läuft. Tool wird geöffnet…"
open ".superdesign/design_iterations/ki_produkt_tool_1_1.html"

echo ""
echo "──────────────────────────────────────────────"
echo "  ✅  Fertig. Das Tool läuft im Browser."
echo ""
echo "  WICHTIG: Dieses Fenster geöffnet lassen,"
echo "  solange du das Tool benutzt."
echo "  Zum Beenden: dieses Fenster schließen."
echo "──────────────────────────────────────────────"

# Keep running until the server stops (or window is closed)
wait $SERVER_PID
